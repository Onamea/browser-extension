import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { EncryptedContainer } from "./EncryptedContainer.ts"
import * as main from "./main.ts"
import { CONTAINER_STORAGE_KEY, PBKDF2_ITERATIONS, MASTER_KEY_LENGTH, GCM_IV_LENGTH } from "./constants.ts"

const encoder = new TextEncoder()

const createStorageMock = (container?: EncryptedContainer, shouldFail = false) => {
	return {
		get: (key: string) => {
			if (shouldFail) {
				return Promise.reject(new Error("Storage read failed"))
			}
			if (container) {
				return Promise.resolve({ [key]: container })
			}
			return Promise.resolve({})
		},
		set: () => {
			if (shouldFail) {
				return Promise.reject(new Error("Storage write failed"))
			}
			return Promise.resolve()
		}
	}
}

const createMockContainer = async (password: string, content: string): Promise<EncryptedContainer> => {
	const salt = crypto.getRandomValues(new Uint8Array(16))
	const iv = crypto.getRandomValues(new Uint8Array(GCM_IV_LENGTH))

	const passwordKey = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveKey"])
	const masterKey = await crypto.subtle.deriveKey(
		{
			name: "PBKDF2",
			hash: "SHA-256",
			iterations: PBKDF2_ITERATIONS,
			salt
		},
		passwordKey,
		{
			name: "AES-GCM",
			length: MASTER_KEY_LENGTH
		},
		false,
		["encrypt", "decrypt"]
	)

	const ciphertext = await crypto.subtle.encrypt(
		{
			name: "AES-GCM",
			iv
		},
		masterKey,
		encoder.encode(content)
	)

	const toBase64 = (buffer: ArrayBuffer | Uint8Array): string => {
		return btoa(String.fromCharCode(...new Uint8Array(buffer)))
	}

	return {
		salt: toBase64(salt),
		iv: toBase64(iv),
		ciphertext: toBase64(new Uint8Array(ciphertext)),
		version: 1
	}
}

describe("main.initialize", () => {
	beforeEach(() => {
		main.deinitialize()
	})

	afterEach(() => {
		main.deinitialize()
	})

	it("initializes with no existing container", async () => {
		vi.stubGlobal("chrome", {
			storage: {
				local: createStorageMock()
			}
		})

		const result = await main.initialize("CorrectHorseBatteryStaple123!")

		expect(result.hasContainer).toBe(false)
		expect(result.content).toBeUndefined()
		expect(result.accessKey).toBeUndefined()
	})

	it("initializes with existing container and correct password", async () => {
		const password = "CorrectHorseBatteryStaple123!"
		const content = '{"data":"test"}'
		const container = await createMockContainer(password, content)

		vi.stubGlobal("chrome", {
			storage: {
				local: createStorageMock(container)
			}
		})

		const result = await main.initialize(password)

		expect(result.hasContainer).toBe(true)
		expect(result.content).toBe(content)
		expect(result.accessKey).toBeDefined()
	})

	it("throws for wrong password", async () => {
		const password = "CorrectHorseBatteryStaple123!"
		const wrongPassword = "WrongPassword123!"
		const content = '{"data":"test"}'
		const container = await createMockContainer(password, content)

		vi.stubGlobal("chrome", {
			storage: {
				local: createStorageMock(container)
			}
		})

		await expect(main.initialize(wrongPassword)).rejects.toThrow(
			"Wrong password or corrupted container"
		)
	})

	it("throws when called twice without deinitialize", async () => {
		const password = "CorrectHorseBatteryStaple123!"
		const content = '{"data":"test"}'
		const container = await createMockContainer(password, content)

		vi.stubGlobal("chrome", {
			storage: {
				local: createStorageMock(container)
			}
		})

		await main.initialize(password)

		await expect(main.initialize(password)).rejects.toThrow(
			"Session already initialized"
		)
	})

	it("throws when stored value is not an encrypted container", async () => {
		vi.stubGlobal("chrome", {
			storage: {
				local: {
					get: () => Promise.resolve({ [CONTAINER_STORAGE_KEY]: "not-a-container" }),
					set: () => Promise.resolve()
				}
			}
		})

		await expect(main.initialize("CorrectHorseBatteryStaple123!")).rejects.toThrow(
			"Storage corrupted: not an EncryptedContainer"
		)
	})

	it("throws when storage read fails", async () => {
		vi.stubGlobal("chrome", {
			storage: {
				local: createStorageMock(undefined, true)
			}
		})

		await expect(main.initialize("CorrectHorseBatteryStaple123!")).rejects.toThrow(
			"Failed to read from extension storage"
		)
	})
})

describe("main.get", () => {
	beforeEach(() => {
		main.deinitialize()
	})

	afterEach(() => {
		main.deinitialize()
	})

	it("retrieves content with valid session key after initialization", async () => {
		const password = "CorrectHorseBatteryStaple123!"
		const content = '{"data":"secret"}'
		const container = await createMockContainer(password, content)

		vi.stubGlobal("chrome", {
			storage: {
				local: createStorageMock(container)
			}
		})

		const initResult = await main.initialize(password)
		const result = await main.get(initResult.accessKey!)

		expect(result.hasContainer).toBe(true)
		expect(result.content).toBe(content)
		expect(result.accessKey).toBe(initResult.accessKey)
	})

	it("throws when get called without initialization", async () => {
		await expect(main.get("CorrectHorseBatteryStaple123!")).rejects.toThrow("No active session")
	})

	it("throws with invalid session key", async () => {
		const password = "CorrectHorseBatteryStaple123!"
		const content = '{"data":"secret"}'
		const container = await createMockContainer(password, content)

		vi.stubGlobal("chrome", {
			storage: {
				local: createStorageMock(container)
			}
		})

		await main.initialize(password)

		await expect(main.get("not-the-session-key")).rejects.toThrow("Invalid session key")
	})

	it("throws after session is invalidated", async () => {
		const password = "CorrectHorseBatteryStaple123!"
		const content = '{"data":"secret"}'
		const container = await createMockContainer(password, content)

		vi.stubGlobal("chrome", {
			storage: {
				local: createStorageMock(container)
			}
		})

		const initResult = await main.initialize(password)
		main.deinitialize()

		await expect(main.get(initResult.accessKey!)).rejects.toThrow("No active session")
	})

	it("expires active session after idle timeout", async () => {
		vi.useFakeTimers()
		try {
			vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"))

			const password = "CorrectHorseBatteryStaple123!"
			const content = '{"data":"secret"}'
			const container = await createMockContainer(password, content)

			vi.stubGlobal("chrome", {
				storage: {
					local: createStorageMock(container)
				}
			})

			const initResult = await main.initialize(password)
			vi.advanceTimersByTime(15 * 60 * 1000 + 1)

			await expect(main.get(initResult.accessKey!)).rejects.toThrow("Session expired")
			await expect(main.get(initResult.accessKey!)).rejects.toThrow("No active session")
		} finally {
			vi.useRealTimers()
		}
	})

	it("expires active session after absolute timeout even with activity", async () => {
		vi.useFakeTimers()
		try {
			vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"))

			const password = "CorrectHorseBatteryStaple123!"
			const content = '{"data":"secret"}'
			const container = await createMockContainer(password, content)

			vi.stubGlobal("chrome", {
				storage: {
					local: createStorageMock(container)
				}
			})

			const initResult = await main.initialize(password)
			for (let i = 0; i < 72; i += 1) {
				await expect(main.get(initResult.accessKey!)).resolves.toMatchObject({ hasContainer: true })
				vi.advanceTimersByTime(10 * 60 * 1000)
			}

			vi.advanceTimersByTime(1)
			await expect(main.get(initResult.accessKey!)).rejects.toThrow("Session expired")
			await expect(main.get(initResult.accessKey!)).rejects.toThrow("No active session")
		} finally {
			vi.useRealTimers()
		}
	})
})

describe("main.set", () => {
	beforeEach(() => {
		main.deinitialize()
	})

	afterEach(() => {
		main.deinitialize()
	})

	it("updates content with valid session key", async () => {
		const password = "CorrectHorseBatteryStaple123!"
		const initialContent = '{"version":1}'
		const newContent = '{"version":2}'
		const container = await createMockContainer(password, initialContent)

		const setMock = vi.fn(() => Promise.resolve())

		vi.stubGlobal("chrome", {
			storage: {
				local: {
					get: () => Promise.resolve({ [CONTAINER_STORAGE_KEY]: container }),
					set: setMock
				}
			}
		})

		const initResult = await main.initialize(password)
		await main.set(initResult.accessKey!, newContent)

		expect(setMock).toHaveBeenCalled()
	})

	it("throws when set called without initialization", async () => {
		await expect(main.set("CorrectHorseBatteryStaple123!", '{"data":"new"}')).rejects.toThrow(
			"No active session"
		)
	})

	it("throws with invalid session key", async () => {
		const password = "CorrectHorseBatteryStaple123!"
		const content = '{"version":1}'
		const container = await createMockContainer(password, content)

		vi.stubGlobal("chrome", {
			storage: {
				local: createStorageMock(container)
			}
		})

		await main.initialize(password)

		await expect(main.set("not-the-session-key", '{"version":2}')).rejects.toThrow("Invalid session key")
	})

	it("throws when content is identical to current content", async () => {
		const password = "CorrectHorseBatteryStaple123!"
		const content = '{"version":1}'
		const container = await createMockContainer(password, content)

		vi.stubGlobal("chrome", {
			storage: {
				local: createStorageMock(container)
			}
		})

		const initResult = await main.initialize(password)

		await expect(main.set(initResult.accessKey!, content)).rejects.toThrow(
			"Content is the same as the current content"
		)
	})

	it("throws when storage write fails", async () => {
		const password = "CorrectHorseBatteryStaple123!"
		const initialContent = '{"version":1}'
		const newContent = '{"version":2}'
		const container = await createMockContainer(password, initialContent)

		vi.stubGlobal("chrome", {
			storage: {
				local: {
					get: () => Promise.resolve({ [CONTAINER_STORAGE_KEY]: container }),
					set: () => Promise.reject(new Error("Failed to write to extension storage"))
				}
			}
		})

		const initResult = await main.initialize(password)

		await expect(main.set(initResult.accessKey!, newContent)).rejects.toThrow(
			"Failed to write to extension storage"
		)
	})

	it("updates session state after successful set", async () => {
		const password = "CorrectHorseBatteryStaple123!"
		const initialContent = '{"version":1}'
		const newContent = '{"version":2}'
		const container = await createMockContainer(password, initialContent)

		vi.stubGlobal("chrome", {
			storage: {
				local: createStorageMock(container)
			}
		})

		const initResult = await main.initialize(password)
		await main.set(initResult.accessKey!, newContent)

		const result = await main.get(initResult.accessKey!)
		expect(result.content).toBe(newContent)
	})

	it("serializes concurrent set calls", async () => {
		const password = "CorrectHorseBatteryStaple123!"
		const initialContent = '{"version":1}'
		const firstContent = '{"version":2}'
		const secondContent = '{"version":3}'
		const container = await createMockContainer(password, initialContent)

		let activeSetCalls = 0
		let maxConcurrentSetCalls = 0
		let setCallCount = 0
		let releaseFirstWrite: () => void = () => {}
		let notifyFirstWriteStarted: () => void = () => {}

		const firstWriteGate = new Promise<void>(resolve => {
			releaseFirstWrite = resolve
		})

		const firstWriteStarted = new Promise<void>(resolve => {
			notifyFirstWriteStarted = resolve
		})

		const setMock = vi.fn(async () => {
			setCallCount += 1
			activeSetCalls += 1
			maxConcurrentSetCalls = Math.max(maxConcurrentSetCalls, activeSetCalls)

			if (setCallCount === 1) {
				notifyFirstWriteStarted()
				await firstWriteGate
			}

			activeSetCalls -= 1
		})

		vi.stubGlobal("chrome", {
			storage: {
				local: {
					get: () => Promise.resolve({ [CONTAINER_STORAGE_KEY]: container }),
					set: setMock
				}
			}
		})

		const initResult = await main.initialize(password)

		const firstSet = main.set(initResult.accessKey!, firstContent)
		await firstWriteStarted

		const secondSet = main.set(initResult.accessKey!, secondContent)
		await Promise.resolve()

		expect(setCallCount).toBe(1)
		releaseFirstWrite()

		await Promise.all([firstSet, secondSet])

		expect(maxConcurrentSetCalls).toBe(1)
		expect(setCallCount).toBe(2)

		const result = await main.get(initResult.accessKey!)
		expect(result.content).toBe(secondContent)
	})
})

describe("main.deinitialize", () => {
	beforeEach(() => {
		main.deinitialize()
	})

	it("clears session state", async () => {
		const password = "CorrectHorseBatteryStaple123!"
		const content = '{"data":"secret"}'
		const container = await createMockContainer(password, content)

		vi.stubGlobal("chrome", {
			storage: {
				local: createStorageMock(container)
			}
		})

		const initResult = await main.initialize(password)
		main.deinitialize()

		await expect(main.get(initResult.accessKey!)).rejects.toThrow("No active session")
	})

	it("can be called multiple times safely", () => {
		expect(() => {
			main.deinitialize()
			main.deinitialize()
			main.deinitialize()
		}).not.toThrow()
	})

	it("resets validation function to default after deinitialize", async () => {
		// This test verifies that after deinitialize(), you can re-initialize
		// The test is that after deinitialize(), a new initialize() call succeeds
		const password = "CorrectHorseBatteryStaple123!"
		const content = '{"data":"test"}'
		const container = await createMockContainer(password, content)

		vi.stubGlobal("chrome", {
			storage: {
				local: createStorageMock(container)
			}
		})

		// Initialize with valid container
		const result1 = await main.initialize(password)
		expect(result1.hasContainer).toBe(true)

		// Deinitialize
		main.deinitialize()

		// After deinitialize, we should be able to initialize again
		// Create a fresh mock since the original might have been consumed
		const freshContainer = await createMockContainer(password, content)
		vi.stubGlobal("chrome", {
			storage: {
				local: (() => {
					let getCalls = 0
					return {
						get: (key: string) => {
							getCalls++
							return Promise.resolve({ [key]: freshContainer })
						},
						set: () => Promise.resolve()
					}
				})()
			}
		})

		const result2 = await main.initialize(password)
		expect(result2.hasContainer).toBe(true)
		expect(result2.content).toBe(content)
		expect(result2.accessKey).toBeDefined()
	})
})

describe("main state transitions", () => {
	beforeEach(() => {
		main.deinitialize()
	})

	afterEach(() => {
		main.deinitialize()
	})

	it("full lifecycle: init → get → set → deinit → error", async () => {
		const password = "CorrectHorseBatteryStaple123!"
		const initialContent = '{"version":1}'
		const newContent = '{"version":2}'
		const container = await createMockContainer(password, initialContent)

		vi.stubGlobal("chrome", {
			storage: {
				local: createStorageMock(container)
			}
		})

		const initResult = await main.initialize(password)
		expect(initResult.content).toBe(initialContent)
		expect(initResult.accessKey).toBeDefined()

		const getResult = await main.get(initResult.accessKey!)
		expect(getResult.content).toBe(initialContent)

		await main.set(initResult.accessKey!, newContent)

		const getResult2 = await main.get(initResult.accessKey!)
		expect(getResult2.content).toBe(newContent)

		main.deinitialize()

		await expect(main.get(initResult.accessKey!)).rejects.toThrow("No active session")
	})

	it("re-initialization after deinitialize", async () => {
		const password = "CorrectHorseBatteryStaple123!"
		const content = '{"data":"test"}'
		const container = await createMockContainer(password, content)

		vi.stubGlobal("chrome", {
			storage: {
				local: createStorageMock(container)
			}
		})

		const initResult = await main.initialize(password)
		main.deinitialize()

		const result = await main.initialize(password)
		expect(result.content).toBe(content)
		expect(result.accessKey).not.toBe(initResult.accessKey)
	})

	it("multiple get calls maintain state", async () => {
		const password = "CorrectHorseBatteryStaple123!"
		const content = '{"data":"test"}'
		const container = await createMockContainer(password, content)

		vi.stubGlobal("chrome", {
			storage: {
				local: createStorageMock(container)
			}
		})

		const initResult = await main.initialize(password)

		const get1 = await main.get(initResult.accessKey!)
		const get2 = await main.get(initResult.accessKey!)
		const get3 = await main.get(initResult.accessKey!)

		expect(get1.content).toBe(content)
		expect(get2.content).toBe(content)
		expect(get3.content).toBe(content)
	})
})
