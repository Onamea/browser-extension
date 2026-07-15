import type { Password } from "./Password.ts"
import {
	ENCRYPTED_CONTAINER_VERSION,
	GCM_IV_LENGTH,
	IV_LENGTH,
	MASTER_KEY_LENGTH,
	MIN_CIPHERTEXT_LENGTH,
	PBKDF2_ITERATIONS,
	SALT_LENGTH
} from "./constants.ts"
import { ContainerError, StoredValueNotEncryptedContainerError } from "./errors.ts"
import { read, write } from "./storage.ts"
import { getRandomBytes } from "./utils/getRandomBytes.ts"
import { toBufferSource } from "./utils/toBufferSource.ts"
import { toBase64, decodeBase64 } from "./utils/base64.ts"
import { isRecord } from "./utils/isRecord.ts"
import { isNonEmptyString } from "./utils/isString.ts"

type Salt = string
type Iv = string
type Ciphertext = string
type Version = number

const encoder = new TextEncoder()

export type EncryptedContainer = {
	salt: Salt
	iv: Iv
	ciphertext: Ciphertext
	version: Version
}

export const isSalt = (value: unknown): value is Salt => {
	if (isNonEmptyString(value) === false) {
		return false
	}

	const bytes = decodeBase64(value)
	return bytes !== undefined && bytes.length === SALT_LENGTH
}

export const isIv = (value: unknown): value is Iv => {
	if (isNonEmptyString(value) === false) {
		return false
	}

	const bytes = decodeBase64(value)
	return bytes !== undefined && bytes.length === IV_LENGTH
}

export const isCipherText = (value: unknown): value is Ciphertext => {
	if (isNonEmptyString(value) === false) {
		return false
	}

	const bytes = decodeBase64(value)
	return bytes !== undefined && bytes.length >= MIN_CIPHERTEXT_LENGTH
}

export const isVersion = (value: unknown): value is Version => {
	return value === ENCRYPTED_CONTAINER_VERSION
}

export const isEncryptedContainer = (value: unknown): value is EncryptedContainer => {

	if (isRecord(value) === false) {
		return false
	}

	if (Object.keys(value).length !== 4) {
		return false
	}

	const maybeContainer = value as Partial<EncryptedContainer>

	if (isSalt(maybeContainer.salt) === false) {
		return false
	}

	if (isIv(maybeContainer.iv) === false) {
		return false
	}

	if (isCipherText(maybeContainer.ciphertext) === false) {
		return false
	}

	if (isVersion(maybeContainer.version) === false) {
		return false
	}

	return true
}

export const clone = (container: EncryptedContainer): EncryptedContainer => {
	return {
		salt: container.salt,
		iv: container.iv,
		ciphertext: container.ciphertext,
		version: container.version
	}
}

export const compareContainers = (left: EncryptedContainer, right: EncryptedContainer): boolean => {
	return (
		left.salt === right.salt
		&& left.iv === right.iv
		&& left.ciphertext === right.ciphertext
		&& left.version === right.version
	)
}

const deriveMasterKey = async (password: Password, salt: Uint8Array): Promise<CryptoKey> => {
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
		false,
		["encrypt", "decrypt"]
	)
}

export const create = async (password: Password): Promise<EncryptedContainer> => {
	const salt = getRandomBytes(SALT_LENGTH)
	const iv = getRandomBytes(GCM_IV_LENGTH)
	const masterKey = await deriveMasterKey(password, salt)
	const ciphertextBuffer = await crypto.subtle.encrypt(
		{
			name: "AES-GCM",
			iv: toBufferSource(iv)
		},
		masterKey,
		encoder.encode("")
	)

	return {
		salt: toBase64(salt),
		iv: toBase64(iv),
		ciphertext: toBase64(new Uint8Array(ciphertextBuffer)),
		version: ENCRYPTED_CONTAINER_VERSION
	}
}

export const readContainer = async (): Promise<EncryptedContainer | undefined> => {
	const value = await read()

	if (value === undefined) {
		return undefined
	}

	if (isEncryptedContainer(value) === false) {
		throw new ContainerError(StoredValueNotEncryptedContainerError)
	}

	return value
}

export const writeContainer = async (container: EncryptedContainer): Promise<void> => {
  await write(container)
}
