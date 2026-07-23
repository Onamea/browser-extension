import { describe, expect, it } from "vitest"
import { checkPassword, invalidate, unlock, update } from "./Session.ts"
import { GCM_IV_LENGTH, MASTER_KEY_LENGTH, PBKDF2_ITERATIONS } from "./constants.ts"
import { toBase64 } from "./utils/base64.ts"
import type { EncryptedContainer } from "./EncryptedContainer.ts"

const encoder = new TextEncoder()

const createEncryptedContainer = async (password: string, plaintext: string): Promise<EncryptedContainer> => {
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
		encoder.encode(plaintext)
	)

	return {
		salt: toBase64(salt),
		iv: toBase64(iv),
		ciphertext: toBase64(new Uint8Array(ciphertext)),
		version: 1
	} as EncryptedContainer
}

describe("Session.unlock", () => {
	it("unlocks container with correct password (happy path)", async () => {
		const password = "CorrectHorseBatteryStaple123!"
		const decrypted = JSON.stringify({ id: "acc_1", value: "secret" })
		const container = await createEncryptedContainer(password, decrypted)

		const session = await unlock(container, password)

		expect(session.state).toBe("ACTIVE")
		expect(session.decryptedContainer).toBe(decrypted)
		expect(session.container).toEqual(container)
		expect(session.container).not.toBe(container)
		expect(session.wrappedMasterKey.byteLength).toBeGreaterThan(0)
		expect(session.wrappingIv.byteLength).toBe(GCM_IV_LENGTH)
	})

	it("throws WrongPasswordOrCorruptedContainerError for incorrect password", async () => {
		const password = "CorrectHorseBatteryStaple123!"
		const wrongPassword = "DefinitelyWrongPassword123!"
		const container = await createEncryptedContainer(password, '{"ok":true}')

		await expect(unlock(container, wrongPassword)).rejects.toThrow(
			"Wrong password or corrupted container"
		)
	})
})

describe("Session.checkPassword", () => {
	it("returns true when password is correct", async () => {
		const password = "CorrectHorseBatteryStaple123!"
		const container = await createEncryptedContainer(password, '{"ok":true}')
		const session = await unlock(container, password)

		await expect(checkPassword(session, password)).resolves.toBe(true)
	})

	it("returns false when password is incorrect", async () => {
		const password = "CorrectHorseBatteryStaple123!"
		const wrongPassword = "DefinitelyWrongPassword123!"
		const container = await createEncryptedContainer(password, '{"ok":true}')
		const session = await unlock(container, password)

		await expect(checkPassword(session, wrongPassword)).resolves.toBe(false)
	})
})

describe("Session.update", () => {
	it("updates decrypted data and produces a re-unlockable container", async () => {
		const password = "CorrectHorseBatteryStaple123!"
		const originalDecrypted = '{"ok":true,"v":1}'
		const nextDecrypted = '{"ok":true,"v":2}'
		const container = await createEncryptedContainer(password, originalDecrypted)
		const session = await unlock(container, password)

		const updatedSession = await update(session, nextDecrypted)

		expect(updatedSession).not.toBe(session)
		expect(updatedSession.decryptedContainer).toBe(nextDecrypted)
		expect(updatedSession.container.salt).toBe(session.container.salt)
		expect(updatedSession.container.version).toBe(session.container.version)
		expect(updatedSession.container.ciphertext).not.toBe(session.container.ciphertext)
		expect(updatedSession.container.iv).not.toBe(session.container.iv)

		const unlockedAgain = await unlock(updatedSession.container, password)
		expect(unlockedAgain.decryptedContainer).toBe(nextDecrypted)
	})
})

describe("Session.invalidate", () => {
	it("invalidates an active session and removes sensitive fields", async () => {
		const password = "CorrectHorseBatteryStaple123!"
		const container = await createEncryptedContainer(password, '{"ok":true}')
		const session = await unlock(container, password)

		const invalidated = invalidate(session)

		expect(invalidated).toBe(session)
		expect(invalidated.state).toBe("INVALIDATED")
		expect("sessionKey" in (invalidated as Record<string, unknown>)).toBe(false)
		expect("wrappedMasterKey" in (invalidated as Record<string, unknown>)).toBe(false)
		expect("wrappingIv" in (invalidated as Record<string, unknown>)).toBe(false)
		expect("container" in (invalidated as Record<string, unknown>)).toBe(false)
		expect("decryptedContainer" in (invalidated as Record<string, unknown>)).toBe(false)
	})

	it("returns the same object when session is already invalidated", () => {
		const invalidatedSession = { state: "INVALIDATED" } as const

		const result = invalidate(invalidatedSession)

		expect(result).toBe(invalidatedSession)
		expect(result.state).toBe("INVALIDATED")
	})
})
