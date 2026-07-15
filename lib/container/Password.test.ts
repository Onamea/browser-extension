import { describe, expect, it } from "vitest"
import { isPassword, parsePassword } from "./Password.ts"

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
