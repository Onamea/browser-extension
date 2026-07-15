import { beforeEach, describe, expect, it, vi } from "vitest"
import type { EncryptedContainer } from "./EncryptedContainer.ts"
import {
	ContainerChangedSinceSessionStartError,
	InvalidPasswordError,
	NoContainerExistsError,
	SessionEncryptionFailedError,
	SessionKeyUnwrapFailedError,
	SessionNotActiveError,
	StoredValueNotEncryptedContainerError,
	WrongPasswordOrCorruptedContainerError
} from "./errors.ts"
import { readContainer } from "./EncryptedContainer.ts"
import { init, invalidate, PBKDF2_ITERATIONS, write } from "./Session.ts"
import { CONTAINER_STORAGE_KEY } from "./storage.ts"
import { fromBase64 } from "./utils/base64.ts"

type StorageShape = {
	[storageKey: string]: EncryptedContainer | undefined
}

const encoder = new TextEncoder()
const decoder = new TextDecoder()
let storageState: StorageShape

const deriveKeyForTest = async (password: string, salt: Uint8Array): Promise<CryptoKey> => {
	const passwordKey = await crypto.subtle.importKey(
		"raw",
		encoder.encode(password),
		"PBKDF2",
		false,
		["deriveKey"]
	)

	return await crypto.subtle.deriveKey(
		{
			name: "PBKDF2",
			hash: "SHA-256",
			iterations: PBKDF2_ITERATIONS,
			salt: Uint8Array.from(salt)
		},
		passwordKey,
		{
			name: "AES-GCM",
			length: 256
		},
		false,
		["decrypt"]
	)
}

const decryptStoredContainer = async (password: string, container: EncryptedContainer): Promise<string> => {
	const key = await deriveKeyForTest(password, fromBase64(container.salt))
	const plaintextBuffer = await crypto.subtle.decrypt(
		{
			name: "AES-GCM",
			iv: Uint8Array.from(fromBase64(container.iv))
		},
		key,
		Uint8Array.from(fromBase64(container.ciphertext))
	)

	return decoder.decode(plaintextBuffer)
}

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

const getStoredContainer = (): EncryptedContainer => {
	const container = storageState[CONTAINER_STORAGE_KEY]

	if (container === undefined) {
		throw new Error("Expected container to be stored")
	}

	return container
}

describe("container round trips", () => {
	it("initializes storage and unlocks an existing container", async () => {
		const password = "hunter222"
		const plaintext = "alpha beta gamma"
		const session = await init(password)
		expect(session.state).toBe("ACTIVE")

		await write(session, plaintext)

		const storedContainer = getStoredContainer()
		await expect(decryptStoredContainer(password, storedContainer)).resolves.toBe(plaintext)

		const parsed = await readContainer()
		expect(parsed).toEqual(storedContainer)

		await expect(init(password)).resolves.toMatchObject({
			wrappedMasterKey: expect.any(ArrayBuffer),
			wrappingIv: expect.any(Uint8Array),
			decryptedContainer: plaintext
		})
	})

	it("treats whitespace-padded passwords the same as trimmed passwords", async () => {
		const password = "  hunter222  "
		const plaintext = "alpha beta gamma"
		const session = await init(password)

		await write(session, plaintext)

		await expect(init("hunter222")).resolves.toMatchObject({
			decryptedContainer: plaintext
		})
	})

	it("writes new plaintext and preserves container metadata", async () => {
		const password = "correct horse battery staple"
		const updatedText = "after"
		const session = await init(password)
		const initialContainer = getStoredContainer()

		await write(session, updatedText)

		const updatedContainer = getStoredContainer()

		expect(updatedContainer.salt).toBe(initialContainer.salt)
		expect(updatedContainer.version).toBe(1)
		expect(updatedContainer.iv).not.toBe(initialContainer.iv)
		expect(updatedContainer.ciphertext).not.toBe(initialContainer.ciphertext)
		await expect(decryptStoredContainer(password, updatedContainer)).resolves.toBe(updatedText)
		expect(session.decryptedContainer).toBe(updatedText)
	})

	it("invalidates session and removes decrypted container", async () => {
		const session = await init("correct horse battery staple")
		expect(session.decryptedContainer).toBe("")

		await write(session, "after")
		expect(session.decryptedContainer).toBe("after")

		const invalidatedSession = invalidate(session)
		expect(invalidatedSession.state).toBe("INVALIDATED")
		expect("decryptedContainer" in invalidatedSession).toBe(false)
		await expect(write(invalidatedSession, "should fail")).rejects.toMatchObject({
			code: SessionNotActiveError.code
		})
	})

	it("allows invalidating an already invalidated session", async () => {
		const session = await init("correct horse battery staple")
		await write(session, "after")

		const invalidatedSession = invalidate(session)
		const invalidatedAgain = invalidate(invalidatedSession)

		expect(invalidatedAgain).toBe(invalidatedSession)
		expect(invalidatedAgain.state).toBe("INVALIDATED")
		expect("decryptedContainer" in invalidatedAgain).toBe(false)
		await expect(write(invalidatedAgain, "should still fail")).rejects.toMatchObject({
			code: SessionNotActiveError.code
		})
	})

	it("aborts when an existing stored value is invalid", async () => {
		storageState[CONTAINER_STORAGE_KEY] = {
			salt: "",
			iv: "",
			ciphertext: "",
			version: 1
		}

		await expect(init("correct horse battery staple")).rejects.toMatchObject({
			code: StoredValueNotEncryptedContainerError.code
		})
		expect(storageState[CONTAINER_STORAGE_KEY]).toEqual({
			salt: "",
			iv: "",
			ciphertext: "",
			version: 1
		})
	})

	it("aborts write when stored container changed after session init", async () => {
		const session = await init("correct horse battery staple")

		storageState[CONTAINER_STORAGE_KEY] = {
			salt: getStoredContainer().salt,
			iv: getStoredContainer().iv,
			ciphertext: "EBESExQVFhcYGRobHB0eHw==",
			version: 1
		}

		await expect(write(session, "after tamper")).rejects.toMatchObject({
			code: ContainerChangedSinceSessionStartError.code
		})
	})

	it("aborts when stored container has malformed base64", async () => {
		storageState[CONTAINER_STORAGE_KEY] = {
			salt: "%%%",
			iv: "%%%",
			ciphertext: "%%%",
			version: 1
		}

		await expect(init("correct horse battery staple")).rejects.toMatchObject({
			code: StoredValueNotEncryptedContainerError.code
		})
	})

	it("aborts when password does not match an existing valid container", async () => {
		await init("correct horse battery staple")

		await expect(init("totally different password")).rejects.toMatchObject({
			code: WrongPasswordOrCorruptedContainerError.code
		})
	})

	it("rejects invalid password before reading or creating a container", async () => {
		await expect(init("       ")).rejects.toMatchObject({
			code: InvalidPasswordError.code
		})
		await expect(init("short")).rejects.toMatchObject({
			code: InvalidPasswordError.code
		})
		expect(storageState[CONTAINER_STORAGE_KEY]).toBeUndefined()
	})

	it("aborts write when container no longer exists in storage", async () => {
		const session = await init("correct horse battery staple")
		delete storageState[CONTAINER_STORAGE_KEY]

		await expect(write(session, "after deletion")).rejects.toMatchObject({
			code: NoContainerExistsError.code
		})
	})

	it("aborts write with typed error when session key unwrap fails", async () => {
		const session = await init("correct horse battery staple")
		session.wrappingIv = new Uint8Array(0)

		await expect(write(session, "after unwrap failure")).rejects.toMatchObject({
			code: SessionKeyUnwrapFailedError.code
		})
	})

	it("aborts write with typed error when session encryption fails", async () => {
		const session = await init("correct horse battery staple")
		const encryptSpy = vi.spyOn(crypto.subtle, "encrypt")
		encryptSpy.mockRejectedValueOnce(new Error("forced encrypt failure"))

		await expect(write(session, "after encryption failure")).rejects.toMatchObject({
			code: SessionEncryptionFailedError.code
		})

		encryptSpy.mockRestore()
	})
})
