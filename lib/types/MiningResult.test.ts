import { describe, it, expect } from "vitest"
import { parseMiningResult, isMiningResult, isUnparsedMiningResult } from "./MiningResult.ts"

describe("parseMiningResult", () => {
	const createTestPublicKey = () => Object.fromEntries(Array.from({ length: 32 }, (_, index) => [index, 1]))
	const createTestPrivateKey = () => Object.fromEntries(Array.from({ length: 48 }, (_, index) => [index, 2]))

	it("should parse a valid unparsed mining result", () => {
		const unparsedResult = {
			nameKey: "Vanic@2B5E9HJQPKJADKCK0SD3G7XEHNFYSXKVPQ9CVS6EW8G1N5031",
			cryptoName: "Ed25519",
			publicKey: createTestPublicKey(),
			publicKeyDisplay: "11".repeat(32),
			privateKey: createTestPrivateKey(),
			privateKeyDisplay: "22".repeat(48),
		}

		expect(isUnparsedMiningResult(unparsedResult)).toBe(true)

		const parsed = parseMiningResult(unparsedResult)

		expect(isMiningResult(parsed)).toBe(true)
		expect(parsed.nameKey).toBe("Vanic@2B5E9HJQPKJADKCK0SD3G7XEHNFYSXKVPQ9CVS6EW8G1N5031")
		expect(parsed.cryptoName).toBe("Ed25519")
		expect(parsed.publicKeyDisplay).toBe("11".repeat(32))
		expect(parsed.privateKeyDisplay).toBe("22".repeat(48))
		expect(parsed.publicKey instanceof Uint8Array).toBe(true)
		expect(parsed.privateKey instanceof Uint8Array).toBe(true)
	})

	it("should parse a mining result with mnemonic display", () => {
		const mnemonicDisplay = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about"
		const unparsedResult = {
			nameKey: "Vanic@2B5E9HJQPKJADKCK0SD3G7XEHNFYSXKVPQ9CVS6EW8G1N5031",
			cryptoName: "Ed25519",
			publicKey: createTestPublicKey(),
			publicKeyDisplay: "11".repeat(32),
			privateKey: createTestPrivateKey(),
			privateKeyDisplay: "22".repeat(48),
			mnemonicDisplay,
		}

		expect(isUnparsedMiningResult(unparsedResult)).toBe(true)

		const parsed = parseMiningResult(unparsedResult)

		expect(isMiningResult(parsed)).toBe(true)
		expect(parsed.mnemonicDisplay).toBe(mnemonicDisplay)
		expect(parsed.publicKey instanceof Uint8Array).toBe(true)
		expect(parsed.privateKey instanceof Uint8Array).toBe(true)
	})

	it("should throw on invalid unparsed mining result", () => {
		const invalidResult = {
			nameKey: "Vanic@2B5E9HJQPKJADKCK0SD3G7XEHNFYSXKVPQ9CVS6EW8G1N5031",
			cryptoName: "Ed25519",
		}

		expect(() => parseMiningResult(invalidResult)).toThrow("Invalid UnparsedMiningResult")
	})

	it("should throw on missing required fields", () => {
		const incompleteResult = {
			nameKey: "Vanic@2B5E9HJQPKJADKCK0SD3G7XEHNFYSXKVPQ9CVS6EW8G1N5031",
			publicKey: createTestPublicKey(),
			publicKeyDisplay: "11".repeat(32),
			privateKey: createTestPrivateKey(),
			privateKeyDisplay: "22".repeat(48),
		}

		expect(() => parseMiningResult(incompleteResult)).toThrow("Invalid UnparsedMiningResult")
	})

	it("should throw on null or undefined", () => {
		expect(() => parseMiningResult(null)).toThrow("Invalid UnparsedMiningResult")
		expect(() => parseMiningResult(undefined)).toThrow("Invalid UnparsedMiningResult")
	})

	it("should parse keys correctly using parseKeyPairAsJSON", () => {
		const unparsedResult = {
			nameKey: "Vanic@2B5E9HJQPKJADKCK0SD3G7XEHNFYSXKVPQ9CVS6EW8G1N5031",
			cryptoName: "Ed25519",
			publicKey: createTestPublicKey(),
			publicKeyDisplay: "11".repeat(32),
			privateKey: createTestPrivateKey(),
			privateKeyDisplay: "22".repeat(48),
		}

		const parsed = parseMiningResult(unparsedResult)

		expect(parsed.publicKey).toBeDefined()
		expect(parsed.privateKey).toBeDefined()
		expect(parsed.publicKey instanceof Uint8Array).toBe(true)
		expect(parsed.privateKey instanceof Uint8Array).toBe(true)
		expect(isMiningResult(parsed)).toBe(true)
	})
})
