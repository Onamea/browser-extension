import { isCryptoName, isMnemonicDisplay, isMnemonicDisplayWithPassphrase, isMnemonicPassphrase, isNameKey, isPrivateKey, isPrivateKeyDisplay, isPublicKey, isPublicKeyDisplay, type CryptoName, type MnemonicDisplay, type MnemonicDisplayWithPassphrase, type MnemonicPassphrase, type NameKey, type PrivateKey, type PrivateKeyDisplay, type PublicKey, type PublicKeyDisplay } from "@onamea/types"
import { parseUint8ArrayObject } from "@onamea/crdt"
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
	mnemonicDisplayWithPassphrase?: MnemonicDisplayWithPassphrase
}

export type UnparsedMiningResult = MiningResult & {
	publicKey: Uint8ArrayObject
	privateKey: Uint8ArrayObject
	mnemonicDisplay?: MnemonicDisplay 
	mnemonicPassphrase?: MnemonicPassphrase
}

export const parseMiningResult = (result: unknown): MiningResult => {
	if (isUnparsedMiningResult(result) === false) {
		throw new Error("Invalid UnparsedMiningResult")
	}

	const mnemonicDisplayWithPassphrase = result.mnemonicDisplay !== undefined ? `${ result.mnemonicDisplay }${ result.mnemonicPassphrase ? ` ${ result.mnemonicPassphrase }` : "" }` : undefined

	return {
		...result,
		publicKey: parseUint8ArrayObject(result.publicKey),
		privateKey: parseUint8ArrayObject(result.privateKey),
		mnemonicDisplayWithPassphrase
	}
}

const isMiningResultShape = (
	value: unknown,
	publicKeyValidator: (value: unknown) => boolean,
	privateKeyValidator: (value: unknown) => boolean
): boolean => {
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
		mnemonicDisplay?: unknown
		mnemonicPassphrase?: unknown
		mnemonicDisplayWithPassphrase?: unknown
	}

	if (isNameKey(candidate.nameKey) === false) {
		return false
	}
	if (isCryptoName(candidate.cryptoName) === false) {
		return false
	}
	if (publicKeyValidator(candidate.publicKey) === false) {
		return false
	}
	if (isPublicKeyDisplay(candidate.publicKeyDisplay) === false) {
		return false
	}
	if (privateKeyValidator(candidate.privateKey) === false) {
		return false
	}
	if (isPrivateKeyDisplay(candidate.privateKeyDisplay) === false) {
		return false
	}
	if (candidate.mnemonicDisplay !== undefined && isMnemonicDisplay(candidate.mnemonicDisplay) === false) {
		return false
	}
	if (candidate.mnemonicPassphrase !== undefined && isMnemonicPassphrase(candidate.mnemonicPassphrase) === false) {
		return false
	}

	if (candidate.mnemonicDisplayWithPassphrase !== undefined && isMnemonicDisplayWithPassphrase(candidate.mnemonicDisplayWithPassphrase) === false) {
		return false
	}

	return true
}

export const isMiningResult = (value: unknown): value is MiningResult => {
	return isMiningResultShape(value, isPublicKey, isPrivateKey)
}

export const isUnparsedMiningResult = (value: unknown): value is UnparsedMiningResult => {
	return isMiningResultShape(value, isUint8ArrayObject, isUint8ArrayObject)
}
