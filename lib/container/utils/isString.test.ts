import { describe, expect, it } from "vitest"
import { isNonEmptyString, isString } from "./isString.ts"

describe("isString", () => {
  it("returns true for string values", () => {
    expect(isString("value")).toBe(true)
  })

  it("returns false for non-string values", () => {
    expect(isString(123)).toBe(false)
    expect(isString(null)).toBe(false)
    expect(isString(undefined)).toBe(false)
  })
})

describe("isNonEmptyString", () => {
  it("returns true for non-empty trimmed strings", () => {
    expect(isNonEmptyString("value")).toBe(true)
    expect(isNonEmptyString(" value ")).toBe(true)
  })

  it("returns false for empty, whitespace-only, and non-string values", () => {
    expect(isNonEmptyString("")).toBe(false)
    expect(isNonEmptyString("   ")).toBe(false)
    expect(isNonEmptyString(false)).toBe(false)
  })
})
