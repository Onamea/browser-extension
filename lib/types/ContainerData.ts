import type { NameKey, FingerprintedName, KeyPairDisplay, KeyPairAsJSON } from "@onamea/types"
import { isFingerprintedName, isKeyPairDisplay, isNameKey, nameKeyToFingerprintedName, parseKeyPairAsJSON } from "@onamea/types"
import { parseMiningResult } from "@/lib/types/MiningResult.ts"
import isObject from "../utils/isObject.ts"

export type ContainerData = {
  nameKey: NameKey
  fingerprintedName: FingerprintedName
  keyPair: KeyPairDisplay
}

export const encodeSessionData = (data: ContainerData): string => {
  return JSON.stringify(data)
}

export const decodeSessionData = (data: string): ContainerData | undefined => {
	try {
		if (data.length === 0) return undefined
		const json: unknown = JSON.parse(data)
		if (isObject(json) === false) throw new Error("Data does not contain a valid JSON object")
		const { nameKey, fingerprintedName, keyPair: _keyPair } = json
		const keyPair = parseKeyPairAsJSON(_keyPair as KeyPairAsJSON)
		if (isNameKey(nameKey) === false) throw new Error("Data does not contain a valid nameKey")
		if (isFingerprintedName(fingerprintedName) === false) throw new Error("Data does not contain a valid fingerprintedName")
		if (isKeyPairDisplay(keyPair) === false) throw new Error("Data does not contain a valid keyPair")
		return { nameKey, fingerprintedName, keyPair }
	} catch (error) {
		console.error("Failed to decode Data:", error)
		return undefined
	}
}

export const buildContainerDataFromMiningResult = async (result: unknown): Promise<ContainerData> => {
	const {
		nameKey,
		cryptoName,
		publicKey,
		publicKeyDisplay,
		privateKey,
		privateKeyDisplay,
		mnemonicDisplay
	} = parseMiningResult(result)

	return {
		nameKey,
		fingerprintedName: await nameKeyToFingerprintedName(nameKey),
		keyPair: {
			cryptoName,
			publicKey,
			publicKeyDisplay,
			privateKey,
			privateKeyDisplay,
			mnemonicDisplay
		}
	}
}
