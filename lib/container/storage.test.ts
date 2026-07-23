import { beforeEach, describe, expect, it, vi } from "vitest"
import { CONTAINER_STORAGE_KEY, read, write } from "./storage.ts"

type StorageShape = {
	[storageKey: string]: unknown
}

type StubLocalStorage = {
	get: (key: string) => Promise<StorageShape>
	set: (items: StorageShape) => Promise<void>
}

let storageState: StorageShape
let shouldRejectGet: boolean
let shouldRejectSet: boolean

beforeEach(() => {
	storageState = {}
	shouldRejectGet = false
	shouldRejectSet = false

	const g = globalThis as typeof globalThis & {
		browser?: { storage?: { local?: StubLocalStorage } }
	}
	delete g.browser

	const localStorage: StubLocalStorage = {
		get: (key: string): Promise<StorageShape> => {
			if (shouldRejectGet) {
				return Promise.reject(new Error("forced get failure"))
			}

			return Promise.resolve({ [key]: storageState[key] })
		},
		set: (items: StorageShape): Promise<void> => {
			if (shouldRejectSet) {
				return Promise.reject(new Error("forced set failure"))
			}

			storageState = { ...storageState, ...items }
			return Promise.resolve()
		}
	}

	vi.stubGlobal("chrome", {
		storage: {
			local: localStorage
		}
	})
})

describe("storage", () => {
	it("reads stored value", async () => {
		storageState[CONTAINER_STORAGE_KEY] = { foo: "bar" }

		await expect(read()).resolves.toEqual({ foo: "bar" })
	})

	it("throws typed error when read fails", async () => {
		shouldRejectGet = true

		await expect(read()).rejects.toThrow("Failed to read from extension storage")
	})

	it("throws typed error when write fails", async () => {
		shouldRejectSet = true

		await expect(
			write({
				salt: "AQIDBAUGBwgJCgsMDQ4PEA==",
				iv: "AQIDBAUGBwgJCgsM",
				ciphertext: "AQIDBAUGBwgJCgsMDQ4PEA==",
				version: 1
			})
		).rejects.toThrow("Failed to write to extension storage")
	})

	it("throws typed error when storage API is unavailable", async () => {
		const g = globalThis as typeof globalThis & {
			chrome?: { storage?: { local?: StubLocalStorage } }
			browser?: { storage?: { local?: StubLocalStorage } }
		}
		delete g.chrome
		delete g.browser

		await expect(read()).rejects.toThrow("Extension storage API is unavailable")
	})

	it("falls back to browser.storage.local when chrome storage is unavailable", async () => {
		const g = globalThis as typeof globalThis & {
			chrome?: { storage?: { local?: StubLocalStorage } }
			browser?: { storage?: { local?: StubLocalStorage } }
		}
		delete g.chrome
		g.browser = {
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
		}

		const container = {
			salt: "AQIDBAUGBwgJCgsMDQ4PEA==",
			iv: "AQIDBAUGBwgJCgsM",
			ciphertext: "AQIDBAUGBwgJCgsMDQ4PEA==",
			version: 1
		}

		storageState[CONTAINER_STORAGE_KEY] = container

		await expect(read()).resolves.toEqual(container)
		await expect(write(container)).resolves.toBeUndefined()
		expect(storageState[CONTAINER_STORAGE_KEY]).toEqual(container)
	})
})
