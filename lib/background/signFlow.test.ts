import { describe, expect, it, vi } from "vitest"

const loadSignFlow = async () => {
  vi.resetModules()
  return await import("./signFlow.ts")
}

describe("signFlow queueing", () => {
  it("queues concurrent sign requests and promotes the next request after confirm", async () => {
    const { getPendingRequest, getSignRequestResults, handleConfirmSign, handleSign } = await loadSignFlow()
    const openPopup = vi.fn().mockResolvedValue(undefined)
    const firstSendResponse = vi.fn()
    const secondSendResponse = vi.fn()
    const popupSendResponse = vi.fn()

    expect(handleSign("first", "request-1", "https://example.com", firstSendResponse, openPopup)).toBe(true)
    expect(handleSign("second", "request-2", "https://example.com", secondSendResponse, openPopup)).toBe(true)
    expect(openPopup).toHaveBeenCalledTimes(1)
    expect(getPendingRequest()?.requestId).toBe("request-1")

    expect(handleConfirmSign({ container: { data: { keyPair: {} } } } as never, popupSendResponse)).toBe(false)

    expect(popupSendResponse).toHaveBeenCalledWith({ error: "Data is not a valid Operation" })
    expect(firstSendResponse).toHaveBeenCalledWith({ error: "Data is not a valid Operation", requestId: "request-1" })
    expect(getPendingRequest()?.requestId).toBe("request-2")
    expect(getSignRequestResults()).toMatchObject([{
      requestId: "request-1",
      origin: "https://example.com",
      status: "failed",
      error: "Data is not a valid Operation"
    }])
  })

  it("rejects requests when the pending queue reaches its maximum length", async () => {
    const { handleSign } = await loadSignFlow()
    const openPopup = vi.fn().mockResolvedValue(undefined)
    const sendResponses: Array<(response: unknown) => void> = Array.from({ length: 9 }, () => vi.fn())

    for (let index = 0; index < 8; index++) {
      expect(
        handleSign(
          `data-${ index }`,
          `request-${ index }`,
          "https://example.com",
          sendResponses[index]!,
          openPopup
        )
      ).toBe(true)
    }

    expect(handleSign("data-8", "request-8", "https://example.com", sendResponses[8]!, openPopup)).toBe(false)
    expect(sendResponses[8]).toHaveBeenCalledWith({ error: "Too many pending sign requests", requestId: "request-8" })
    expect(openPopup).toHaveBeenCalledTimes(1)
  })

  it("records rejected requests in sign result history", async () => {
    const { getPendingRequest, getSignRequestResults, handleRejectSign, handleSign } = await loadSignFlow()
    const openPopup = vi.fn().mockResolvedValue(undefined)
    const requestSendResponse = vi.fn()
    const popupSendResponse = vi.fn()

    expect(handleSign("request", "request-1", "https://example.com", requestSendResponse, openPopup)).toBe(true)
    expect(handleRejectSign(popupSendResponse)).toBe(false)

    expect(requestSendResponse).toHaveBeenCalledWith({ error: "rejected", requestId: "request-1" })
    expect(popupSendResponse).toHaveBeenCalledWith({ ok: true })
    expect(getPendingRequest()).toBeUndefined()
    expect(getSignRequestResults()).toMatchObject([{
      requestId: "request-1",
      origin: "https://example.com",
      status: "rejected"
    }])
  })

  it("rejects pending requests when the sign confirmation popup cannot be opened", async () => {
    const { getPendingRequest, getSignRequestResults, handleSign } = await loadSignFlow()
    const openPopup = vi.fn().mockRejectedValue(new Error("Popup blocked"))
    const firstSendResponse = vi.fn()
    const secondSendResponse = vi.fn()

    expect(handleSign("first", "request-1", "https://example.com", firstSendResponse, openPopup)).toBe(true)
    expect(handleSign("second", "request-2", "https://example.com", secondSendResponse, openPopup)).toBe(true)

    await vi.waitFor(() => {
      expect(firstSendResponse).toHaveBeenCalledWith({ error: "Unable to open sign confirmation", requestId: "request-1" })
      expect(secondSendResponse).toHaveBeenCalledWith({ error: "Unable to open sign confirmation", requestId: "request-2" })
    })
    expect(getPendingRequest()).toBeUndefined()
    expect(getSignRequestResults()).toMatchObject([
      { requestId: "request-2", status: "failed", error: "Unable to open sign confirmation" },
      { requestId: "request-1", status: "failed", error: "Unable to open sign confirmation" }
    ])
  })
})
