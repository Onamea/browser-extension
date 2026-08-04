import { isCryptoName, isNameKey, isPrivateKey, isPrivateKeyDisplay, isPublicKey, isPublicKeyDisplay, type CryptoName, type NameKey, type PrivateKey, type PrivateKeyDisplay, type PublicKey, type PublicKeyDisplay } from "@vanice/types"
import { parseUint8ArrayObject } from "@vanice/crdt"
import isObject from "../utils/isObject.ts"

type Uint8ArrayObject = Record<string, number>

const isUint8ArrayObject = (value: unknown): value is Uint8ArrayObject => {
	if (isObject(value) === false) {
		return false
	}
	const candidate = value as Uint8ArrayObject
	return Object.entries(candidate).every(([k, v]) => typeof k === "string" && typeof v === "number")
}

export type MiningResult = {
	nameKey: NameKey
	cryptoName: CryptoName
	publicKey: PublicKey
	publicKeyDisplay: PublicKeyDisplay
	privateKey: PrivateKey
	privateKeyDisplay: PrivateKeyDisplay
}

export type UnparsedMiningResult = MiningResult & {
	publicKey: Uint8ArrayObject
	privateKey: Uint8ArrayObject
}

export const parseMiningResult = (result: unknown): MiningResult => {
	if (isUnparsedMiningResult(result) === false) {
		throw new Error("Invalid UnparsedMiningResult")
	}
	return {
		...result,
		publicKey: parseUint8ArrayObject(result.publicKey),
		privateKey: parseUint8ArrayObject(result.privateKey)
	}
}

export const isMiningResult = (value: unknown): value is MiningResult => {
	if (isObject(value) === false) {
		return false
	}

	const candidate = value as {
		nameKey?: unknown
		cryptoName?: unknown
		publicKey?: unknown
		publicKeyDisplay?: unknown
		privateKey?: unknown
		privateKeyDisplay?: unknown
	}

	if (isNameKey(candidate.nameKey) === false) {
		return false
	}
	if (isCryptoName(candidate.cryptoName) === false) {
		return false
	}
	if (isPublicKey(candidate.publicKey) === false) {
		return false
	}
	if (isPublicKeyDisplay(candidate.publicKeyDisplay) === false) {
		return false
	}
	if (isPrivateKey(candidate.privateKey) === false) {
		return false
	}
	if (isPrivateKeyDisplay(candidate.privateKeyDisplay) === false) {
		return false
	}

	return true
}

export const isUnparsedMiningResult = (value: unknown): value is UnparsedMiningResult => {
	if (isObject(value) === false) {
		return false
	}

	const candidate = value as {
		nameKey?: unknown
		cryptoName?: unknown
		publicKey?: unknown
		publicKeyDisplay?: unknown
		privateKey?: unknown
		privateKeyDisplay?: unknown
	}

	if (isNameKey(candidate.nameKey) === false) {
		return false
	}
	if (isCryptoName(candidate.cryptoName) === false) {
		return false
	}
	if (isUint8ArrayObject(candidate.publicKey) === false) {
		return false
	}
	if (isPublicKeyDisplay(candidate.publicKeyDisplay) === false) {
		return false
	}
	if (isUint8ArrayObject(candidate.privateKey) === false) {
		return false
	}
	if (isPrivateKeyDisplay(candidate.privateKeyDisplay) === false) {
		return false
	}

	return true
}
