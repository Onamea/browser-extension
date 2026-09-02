import { describe, expect, it } from "vitest"
import { fromBase64, toBase64 } from "./base64.ts"

describe("base64 utils", () => {
  it("round trips bytes through base64", () => {
    const original = new Uint8Array(Array.from({ length: 256 }, (_, index) => index))
    const encoded = toBase64(original)
    const decoded = fromBase64(encoded)

    expect(decoded).toEqual(original)
  })

  it("throws on malformed base64 input", () => {
    expect(() => fromBase64("%%%"))
      .toThrow()
  })
})
