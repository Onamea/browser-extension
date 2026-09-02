import { describe, expect, it } from "vitest"
import { generateAccessKey, isAccessKey } from "./AccessKey.ts"

describe("AccessKey", () => {
  it("validates only strings with exact access key length", () => {
    expect(isAccessKey("a".repeat(44))).toBe(true)
    expect(isAccessKey("a".repeat(43)))
      .toBe(false)
    expect(isAccessKey("a".repeat(45)))
      .toBe(false)
    expect(isAccessKey(undefined))
      .toBe(false)
    expect(isAccessKey(123))
      .toBe(false)
    expect(isAccessKey(generateAccessKey())).toBe(true)
  })

  it("generates a base64 string from random bytes", () => {
    const accessKey = generateAccessKey()

    expect(typeof accessKey).toBe("string")
    expect(accessKey.length).toBe(44)
  })
})
