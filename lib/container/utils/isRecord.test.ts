import { describe, expect, it } from "vitest"
import { isRecord } from "./isRecord.ts"

describe("isRecord", () => {
	it("returns true for non-empty plain objects", () => {
		expect(isRecord({ value: 1 })).toBe(true)
	})

	it("returns true for empty objects", () => {
		expect(isRecord({})).toBe(true)
	})

	it("returns false for null, arrays, and primitives", () => {
		expect(isRecord(null)).toBe(false)
		expect(isRecord([])).toBe(false)
		expect(isRecord("value")).toBe(false)
		expect(isRecord(1)).toBe(false)
		expect(isRecord(true)).toBe(false)
		expect(isRecord(undefined)).toBe(false)
	})
})
