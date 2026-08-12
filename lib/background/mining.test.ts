import { afterEach, describe, expect, it, vi } from "vitest"
import { shouldUseOffscreenMining } from "./mining.ts"

describe("shouldUseOffscreenMining", () => {
  const originalChrome = (globalThis as typeof globalThis & { chrome?: unknown }).chrome

  afterEach(() => {
    if (originalChrome === undefined) {
      delete (globalThis as typeof globalThis & { chrome?: unknown }).chrome
    } else {
      ;(globalThis as typeof globalThis & { chrome?: unknown }).chrome = originalChrome
    }
  })

  it("returns false when the offscreen API is unavailable", () => {

    delete (globalThis as typeof globalThis & { chrome?: unknown }).chrome

    expect(shouldUseOffscreenMining()).toBe(false)
  })

  it("returns true when the offscreen API is available", () => {

    (globalThis as typeof globalThis & { chrome?: unknown }).chrome = {
      offscreen: {
        createDocument: vi.fn(),
        Reason: {
          DOM_PARSER: "DOM_PARSER"
        }
      }
    }

    expect(shouldUseOffscreenMining()).toBe(true)
  })
})
