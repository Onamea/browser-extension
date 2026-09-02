import { afterEach, describe, expect, it, vi } from "vitest"
import { confirmSignRequest } from "./apiClient.ts"

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("confirmSignRequest", () => {
  it("throws the background confirmation error", async () => {
    const sendMessage = vi.fn().mockResolvedValue({ error: "Signing failed" })
    vi.stubGlobal("browser", {
      runtime: { sendMessage }
    })

    await expect(confirmSignRequest()).rejects.toThrow("Signing failed")
  })
})