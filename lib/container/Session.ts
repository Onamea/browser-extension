import { clone, compareContainers, create, type EncryptedContainer, readContainer, writeContainer } from "./EncryptedContainer.ts"
import { GCM_IV_LENGTH, MASTER_KEY_LENGTH, PBKDF2_ITERATIONS } from "./constants.ts"
import {
	ContainerChangedSinceSessionStartError,
	ContainerError,
	InvalidPasswordError,
	NoContainerExistsError,
	SessionEncryptionFailedError,
	SessionKeyUnwrapFailedError,
	SessionNotActiveError,
	WrongPasswordOrCorruptedContainerError
} from "./errors.ts"
import { fromBase64, toBase64 } from "./utils/base64.ts"
import { getRandomBytes } from "./utils/getRandomBytes.ts"
import { type Password, parsePassword } from "./Password.ts"
import { toBufferSource } from "./utils/toBufferSource.ts"

export type SessionState = "ACTIVE" | "INVALIDATED"

export type ActiveSession = {
	state: Extract<SessionState, "ACTIVE">
	sessionKey: CryptoKey
	wrappedMasterKey: ArrayBuffer
	wrappingIv: Uint8Array
	decryptedContainer: string
	container: EncryptedContainer
}

export type InvalidatedSession = {
	state: Extract<SessionState, "INVALIDATED">
}

export type Session = ActiveSession | InvalidatedSession

export { PBKDF2_ITERATIONS }

const encoder = new TextEncoder()
const decoder = new TextDecoder()

const deriveMasterKey = async (password: Password, salt: Uint8Array, extractable: boolean): Promise<CryptoKey> => {
	const passwordKey = await crypto.subtle.importKey(
		"raw",
		encoder.encode(password),
		"PBKDF2",
		false,
		["deriveKey"]
	)

	return crypto.subtle.deriveKey(
		{
			name: "PBKDF2",
			hash: "SHA-256",
			iterations: PBKDF2_ITERATIONS,
			salt: toBufferSource(salt)
		},
		passwordKey,
		{
			name: "AES-GCM",
			length: MASTER_KEY_LENGTH
		},
		extractable,
		["encrypt", "decrypt"]
	)
}

const decryptWithMasterKey = async (masterKey: CryptoKey, iv: Uint8Array, ciphertext: Uint8Array): Promise<string> => {
	const plaintextBuffer = await crypto.subtle.decrypt(
		{
			name: "AES-GCM",
			iv: toBufferSource(iv)
		},
		masterKey,
		toBufferSource(ciphertext)
	)

	return decoder.decode(plaintextBuffer)
}

const unwrapMasterKey = async (session: ActiveSession): Promise<CryptoKey> => {
	try {
		return await crypto.subtle.unwrapKey(
			"raw",
			session.wrappedMasterKey,
			session.sessionKey,
			{
				name: "AES-GCM",
				iv: toBufferSource(session.wrappingIv)
			},
			{
				name: "AES-GCM",
				length: MASTER_KEY_LENGTH
			},
			false,
			["encrypt", "decrypt"]
		)
	} catch (error) {
		void error
		throw new ContainerError(SessionKeyUnwrapFailedError)
	}
}

const isActiveSession = (session: Session): session is ActiveSession => {
	return session.state === "ACTIVE"
}

const unlockContainer = async (container: EncryptedContainer, password: Password): Promise<ActiveSession> => {
	let salt: Uint8Array
	let decryptedContainer: string
	let masterKey: CryptoKey

	try {
		salt = fromBase64(container.salt)
		const iv = fromBase64(container.iv)
		const ciphertext = fromBase64(container.ciphertext)
		masterKey = await deriveMasterKey(password, salt, true)
		decryptedContainer = await decryptWithMasterKey(masterKey, iv, ciphertext)
	} catch (error) {
		void error
		throw new ContainerError(WrongPasswordOrCorruptedContainerError)
	}

	const sessionKey = await crypto.subtle.generateKey(
		{
			name: "AES-GCM",
			length: MASTER_KEY_LENGTH
		},
		false,
		["wrapKey", "unwrapKey"]
	)
	const wrappingIv = getRandomBytes(GCM_IV_LENGTH)
	const wrappedMasterKey = await crypto.subtle.wrapKey(
		"raw",
		masterKey,
		sessionKey,
		{
			name: "AES-GCM",
			iv: toBufferSource(wrappingIv)
		}
	)

	return {
		state: "ACTIVE",
		sessionKey,
		wrappedMasterKey,
		wrappingIv,
		decryptedContainer,
		container: clone(container)
	}
}

const encryptWithSession = async (session: ActiveSession, plaintext: string): Promise<EncryptedContainer> => {
	const masterKey = await unwrapMasterKey(session)
	const iv = getRandomBytes(GCM_IV_LENGTH)
	let ciphertextBuffer: ArrayBuffer

	try {
		ciphertextBuffer = await crypto.subtle.encrypt(
			{
				name: "AES-GCM",
				iv: toBufferSource(iv)
			},
			masterKey,
			encoder.encode(plaintext)
		)
	} catch (error) {
		void error
		throw new ContainerError(SessionEncryptionFailedError)
	}

	return {
		salt: session.container.salt,
		iv: toBase64(iv),
		ciphertext: toBase64(new Uint8Array(ciphertextBuffer)),
		version: session.container.version
	}
}

export const init = async (password: string): Promise<ActiveSession> => {
	let parsedPassword: Password

	try {
		parsedPassword = parsePassword(password)
	} catch (error) {
		void error
		throw new ContainerError(InvalidPasswordError)
	}

	const stored = await readContainer()

	if (stored === undefined) {
		const container = await create(parsedPassword)
		await writeContainer(container)
		return await unlockContainer(container, parsedPassword)
	} else {
		return await unlockContainer(stored, parsedPassword)
	}
}

export const write = async (session: Session, content: string): Promise<void> => {
	if (isActiveSession(session) === false) {
		throw new ContainerError(SessionNotActiveError)
	}

	const stored = await readContainer()
	if (stored === undefined) {
		throw new ContainerError(NoContainerExistsError)
	}
	if (compareContainers(stored, session.container) === false) {
		throw new ContainerError(ContainerChangedSinceSessionStartError)
	}
	const encrypted = await encryptWithSession(session, content)
	await writeContainer(encrypted)
	session.container = clone(encrypted)
	session.decryptedContainer = content
}

export const invalidate = (session: Session): InvalidatedSession => {
	if (isActiveSession(session) === false) {
		return session
	}

	session.wrappedMasterKey = new ArrayBuffer(0)
	session.wrappingIv = new Uint8Array(0)
	session.decryptedContainer = ""

	const mutableSession = session as Record<string, unknown>
	Reflect.deleteProperty(mutableSession, "sessionKey")
	Reflect.deleteProperty(mutableSession, "wrappedMasterKey")
	Reflect.deleteProperty(mutableSession, "wrappingIv")
	Reflect.deleteProperty(mutableSession, "container")
	Reflect.deleteProperty(mutableSession, "decryptedContainer")
	mutableSession.state = "INVALIDATED"

	return session as unknown as InvalidatedSession
}
