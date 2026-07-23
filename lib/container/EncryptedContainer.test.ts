import { beforeEach, describe, expect, it, vi } from "vitest"
import { clone, compareContainers, isEncryptedContainer, type EncryptedContainer } from "./EncryptedContainer.ts"

type StorageShape = {
	[storageKey: string]: unknown
}

let storageState: StorageShape

beforeEach(() => {
	storageState = {}
	vi.stubGlobal("chrome", {
		storage: {
			local: {
				get: (key: string): Promise<StorageShape> => {
					return Promise.resolve({ [key]: storageState[key] })
				},
				set: (items: StorageShape): Promise<void> => {
					storageState = { ...storageState, ...items }
					return Promise.resolve()
				}
			}
		}
	})
})

describe("encrypted container validation", () => {
	it("accepts a valid encrypted container shape", () => {
		const value: EncryptedContainer = {
			salt: "AQIDBAUGBwgJCgsMDQ4PEA==",
			iv: "AQIDBAUGBwgJCgsM",
			ciphertext: "AQIDBAUGBwgJCgsMDQ4PEA==",
			version: 1
		}

		expect(isEncryptedContainer(value)).toBe(true)
	})

	it("rejects invalid shapes", () => {
		expect(isEncryptedContainer(undefined)).toBe(false)
		expect(isEncryptedContainer(null)).toBe(false)
		expect(isEncryptedContainer([])).toBe(false)
		expect(isEncryptedContainer({})).toBe(false)
		expect(
			isEncryptedContainer({
				salt: "AQIDBAUGBwgJCgsMDQ4PEA==",
				iv: "AQIDBAUGBwgJCgsM",
				version: 1
			})
		).toBe(false)
		expect(
			isEncryptedContainer({
				salt: "AQIDBAUGBwgJCgsMDQ4PEA==",
				iv: "AQIDBAUGBwgJCgsM",
				ciphertext: "AQIDBAUGBwgJCgsMDQ4PEA==",
				version: 2
			})
		).toBe(false)
		expect(
			isEncryptedContainer({
				salt: "",
				iv: "AQIDBAUGBwgJCgsM",
				ciphertext: "AQIDBAUGBwgJCgsMDQ4PEA==",
				version: 1
			})
		).toBe(false)
		expect(
			isEncryptedContainer({
				salt: "%%%",
				iv: "AQIDBAUGBwgJCgsM",
				ciphertext: "AQIDBAUGBwgJCgsMDQ4PEA==",
				version: 1
			})
		).toBe(false)
		expect(
			isEncryptedContainer({
				salt: "AQID",
				iv: "AQIDBAUGBwgJCgsM",
				ciphertext: "AQIDBAUGBwgJCgsMDQ4PEA==",
				version: 1
			})
		).toBe(false)
		expect(
			isEncryptedContainer({
				salt: "AQIDBAUGBwgJCgsMDQ4PEA==",
				iv: "AQID",
				ciphertext: "AQIDBAUGBwgJCgsMDQ4PEA==",
				version: 1
			})
		).toBe(false)
		expect(
			isEncryptedContainer({
				salt: "AQIDBAUGBwgJCgsMDQ4PEA==",
				iv: "AQIDBAUGBwgJCgsM",
				ciphertext: "AQID",
				version: 1
			})
		).toBe(false)
		expect(
			isEncryptedContainer({
				salt: "AQIDBAUGBwgJCgsMDQ4PEA==",
				iv: "AQIDBAUGBwgJCgsM",
				ciphertext: "AQIDBAUGBwgJCgsMDQ4PEA==",
				version: 1,
				extra: true
			})
		).toBe(false)
	})
})

describe("container helpers", () => {
	it("clone returns a copy with equal values", () => {
		const original: EncryptedContainer = {
			salt: "AQIDBAUGBwgJCgsMDQ4PEA==",
			iv: "AQIDBAUGBwgJCgsM",
			ciphertext: "AQIDBAUGBwgJCgsMDQ4PEA==",
			version: 1
		}

		const cloned = clone(original)

		expect(cloned).toEqual(original)
		expect(cloned).not.toBe(original)
	})

	it("compareContainers returns true only when all fields match", () => {
		const left: EncryptedContainer = {
			salt: "AQIDBAUGBwgJCgsMDQ4PEA==",
			iv: "AQIDBAUGBwgJCgsM",
			ciphertext: "AQIDBAUGBwgJCgsMDQ4PEA==",
			version: 1
		}

		expect(compareContainers(left, clone(left))).toBe(true)
		expect(compareContainers(left, { ...left, salt: "changed" })).toBe(false)
		expect(compareContainers(left, { ...left, iv: "changed" })).toBe(false)
		expect(compareContainers(left, { ...left, ciphertext: "changed" })).toBe(false)
		expect(compareContainers(left, { ...left, version: 99 })).toBe(false)
	})
})
