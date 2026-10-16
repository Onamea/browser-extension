import { describe, expect, it } from "vitest"
import { isPassword, parsePassword, passwordStrength } from "./Password.ts"

describe("password validation", () => {
  it("accepts passwords at the minimum length", () => {
    expect(isPassword("12345678")).toBe(true)
  })

  it("accepts passwords longer than the minimum length", () => {
    expect(isPassword("123456789")).toBe(true)
  })

  it("rejects passwords shorter than the minimum length", () => {
    expect(isPassword("1234567")).toBe(false)
  })

  it("rejects passwords that are only whitespace", () => {
    expect(isPassword("        ")).toBe(false)
  })

  it("rejects non-string values", () => {
    expect(isPassword(12345678)).toBe(false)
  })

  it("trims whitespace when parsing passwords", () => {
    expect(parsePassword(" 12345678 ")).toBe("12345678")
  })

  it("rejects whitespace-padded passwords that are too short after trimming", () => {
    expect(() => parsePassword(" 1234567 ")).toThrow()
  })
})

describe("password strength", () => {
  it("scores passwords after trimming surrounding whitespace", () => {
    expect(passwordStrength(" 123456789 ")).toEqual(passwordStrength("123456789"))
  })

  it("returns a strength value for valid passwords", () => {
    expect(passwordStrength("1234567")[1]).toBeUndefined()
    expect(passwordStrength("12345678")[0]).toBe(6)
    expect(passwordStrength("123456789")[0]).toBeGreaterThan(6.1)
    expect(passwordStrength("1234567890123456")[0]).toBe(7)
    expect(passwordStrength("12345678123456781234")[0]).toBe(7.5)
    expect(passwordStrength("a".repeat(24))[0]).toBe(8)
    expect(passwordStrength("a".repeat(32))[0]).toBe(9)
    expect(passwordStrength("a".repeat(64))[0]).toBe(10)
    expect(passwordStrength("a".repeat(64))[1]).toBe("9.9")
  })
}) 
