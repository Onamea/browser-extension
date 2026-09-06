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

    const nameKey = "Aa@9MG9ABRF4XGFJ25PWUAFKS449A0S9NQRKAPB9EVK3GD6B7PG6G0"
    await expect(confirmSignRequest(nameKey)).rejects.toThrow("Signing failed")
  })
})
