import { beforeEach, describe, expect, it, vi } from "vitest"

const mockCheckStorage = vi.hoisted(() => vi.fn())
const mockGetLocalStateFromMessages = vi.hoisted(() => vi.fn())
const mockAddListener = vi.hoisted(() => vi.fn())
const mockSendMessage = vi.hoisted(() => vi.fn())

let registeredListener:
  | ((message: unknown, sender: { tab?: unknown, url?: string }, sendResponse: (response: unknown) => void) => boolean | undefined)
  | undefined

const extensionBaseUrl = "moz-extension://test/"

vi.mock("@/lib/container/main.ts", () => ({
  checkStorage: mockCheckStorage
}))

vi.mock("@/lib/storage/identityMessagesStorage.ts", () => ({
  getLocalStateFromMessages: mockGetLocalStateFromMessages
}))

const loadBackground = async () => {
  vi.resetModules()
  registeredListener = undefined

  const g = globalThis as typeof globalThis & {
    browser?: unknown
    defineBackground?: unknown
  }

  g.browser = {
    runtime: {
      onMessage: {
        addListener: (listener: typeof registeredListener) => {
          registeredListener = listener
          mockAddListener(listener)
        }
      },
      sendMessage: mockSendMessage,
      getURL: () => extensionBaseUrl
    },
    action: {
      openPopup: vi.fn()
    }
  }

  g.defineBackground = (factory: () => void) => factory()

  await import("../../entrypoints/background.ts")
}

const sendStateInit = async () => {
  return await sendMessage({ type: "STATE:INIT" }, extensionBaseUrl)
}

const sendMessage = async (message: unknown, senderUrl = extensionBaseUrl) => {
  if (registeredListener === undefined) {
    throw new Error("background listener was not registered")
  }

  const sendResponse = vi.fn()
  const result = registeredListener(message, { url: senderUrl }, sendResponse)

  await vi.waitFor(() => {
    expect(sendResponse).toHaveBeenCalled()
  })

  return { result, sendResponse }
}

describe("background STATE_INIT", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCheckStorage.mockReset()
    mockGetLocalStateFromMessages.mockReset()
  })

  it("initializes container and local state when both sources load", async () => {
    mockCheckStorage.mockResolvedValue(true)
    mockGetLocalStateFromMessages.mockResolvedValue({
      messages: [{ raw: "create-op" }],
      identity: undefined
    })

    await loadBackground()
    const { result, sendResponse } = await sendStateInit()

    expect(result).toBe(true)
    expect(sendResponse).toHaveBeenCalledWith({
      state: expect.objectContaining({
        isInitialized: true,
        container: expect.objectContaining({
          hasContainer: true
        }),
        local: {
          messages: [{ raw: "create-op" }],
          identity: undefined
        }
      })
    })
  })

  it("keeps container existence when local state fails to load", async () => {
    mockCheckStorage.mockResolvedValue(true)
    mockGetLocalStateFromMessages.mockRejectedValue(new Error("local state failed"))

    await loadBackground()
    const { result, sendResponse } = await sendStateInit()

    expect(result).toBe(true)
    expect(sendResponse).toHaveBeenCalledWith({
      state: expect.objectContaining({
        isInitialized: true,
        container: expect.objectContaining({
          hasContainer: true
        }),
        local: {
          messages: [],
          identity: undefined
        }
      })
    })
  })
})

describe("background API_IDENTIFY", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCheckStorage.mockReset()
    mockGetLocalStateFromMessages.mockReset()
  })

  it("returns an error before initialization", async () => {
    mockCheckStorage.mockResolvedValue(true)
    mockGetLocalStateFromMessages.mockResolvedValue({
      messages: [],
      identity: undefined
    })

    await loadBackground()
    const { result, sendResponse } = await sendMessage({ type: "API:IDENTIFY" }, "https://example.com")

    expect(result).toBe(false)
    expect(sendResponse).toHaveBeenCalledWith({ error: "Extension not initialized" })
  })

  it("returns the local identity after initialization", async () => {
    const identity = {
      fingerprintedName: "Alice",
      messages: [{ raw: "identity-op" }]
    }

    mockCheckStorage.mockResolvedValue(true)
    mockGetLocalStateFromMessages.mockResolvedValue({
      messages: [{ raw: "identity-op" }],
      identity: identity as never
    })

    await loadBackground()
    await sendStateInit()
    const { result, sendResponse } = await sendMessage({ type: "API:IDENTIFY" }, "https://example.com")

    expect(result).toBe(false)
    expect(sendResponse).toHaveBeenCalledWith(identity)
  })

  it("returns an error when initialized but no local identity is available", async () => {
    mockCheckStorage.mockResolvedValue(true)
    mockGetLocalStateFromMessages.mockResolvedValue({
      messages: [],
      identity: undefined
    })

    await loadBackground()
    await sendStateInit()
    const { result, sendResponse } = await sendMessage({ type: "API:IDENTIFY" }, "https://example.com")

    expect(result).toBe(false)
    expect(sendResponse).toHaveBeenCalledWith({ error: "Identity not available" })
  })
})

  describe("background API_SIGN", () => {
    beforeEach(() => {
      vi.clearAllMocks()
      mockCheckStorage.mockReset()
      mockGetLocalStateFromMessages.mockReset()
    })

    it("rejects sign requests above the pending locked-session limit", async () => {
      mockCheckStorage.mockResolvedValue(true)
      mockGetLocalStateFromMessages.mockResolvedValue({
        messages: [],
        identity: undefined
      })

      await loadBackground()
      await sendStateInit()
      const sendResponses = Array.from({ length: 9 }, () => vi.fn())

      for (let index = 0; index < 8; index++) {
        expect(registeredListener?.({ type: "API:SIGN", data: {}, requestId: `request-${ index }` }, { url: "https://example.com" }, sendResponses[index]!)).toBe(true)
      }

      expect(registeredListener?.({ type: "API:SIGN", data: {}, requestId: "request-8" }, { url: "https://example.com" }, sendResponses[8]!)).toBe(false)
      expect(sendResponses[8]).toHaveBeenCalledWith({ error: "Too many pending sign requests", requestId: "request-8" })
      for (const sendResponse of sendResponses.slice(0, 8)) {
        expect(sendResponse).not.toHaveBeenCalled()
      }
    })
  })
