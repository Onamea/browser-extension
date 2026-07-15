import { describe, expect, it } from "vitest"
import { toBufferSource } from "./toBufferSource.ts"

describe("toBufferSource", () => {
	it("returns the same Uint8Array when backed by ArrayBuffer", () => {
		const bytes = new Uint8Array([1, 2, 3])

		const result = toBufferSource(bytes)

		expect(result).toBe(bytes)
		expect(result.buffer).toBe(bytes.buffer)
	})

	it("copies bytes when backed by SharedArrayBuffer", () => {
		const sharedBuffer = new SharedArrayBuffer(3)
		const bytes = new Uint8Array(sharedBuffer)
		bytes.set([1, 2, 3])

		const result = toBufferSource(bytes)

		expect(result).not.toBe(bytes)
		expect(Array.from(result)).toEqual([1, 2, 3])
		expect(result.buffer).toBeInstanceOf(ArrayBuffer)
		expect(result.buffer).not.toBe(sharedBuffer)
	})
})
