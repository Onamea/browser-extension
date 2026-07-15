import { describe, expect, it } from "vitest"
import { getRandomBytes } from "./getRandomBytes.ts"

describe("getRandomBytes", () => {
	it("returns Uint8Array with requested length", () => {
		const bytes = getRandomBytes(16)

		expect(bytes).toBeInstanceOf(Uint8Array)
		expect(bytes).toHaveLength(16)
	})

	it("returns empty array for zero length", () => {
		const bytes = getRandomBytes(0)

		expect(bytes).toBeInstanceOf(Uint8Array)
		expect(bytes).toHaveLength(0)
	})
})
