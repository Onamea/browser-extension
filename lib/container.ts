import { isFingerprintedName, isKeyPairDisplay, isNameKey, type KeyPairAsJSON, parseKeyPairAsJSON } from "@vanice/types"
import { init, invalidate, write } from "./container/Session.ts"
import type { SlotDataState } from "./background/state.ts"
import isObject from "./utils/isObject.ts"

export const readSession = async (password: string): Promise<SlotDataState | undefined> => {
	try {
		const session = await init(password)
    return decodeSessionData(session.decryptedContainer) 
	} catch {
		return undefined
	}
}

export const writeSession = async (password: string, data: SlotDataState): Promise<boolean> => {
	try {
    const session = await init(password)
		await write(session, encodeSessionData(data))
		return true
	} catch {
    return false
	}
}

export const invalidateSession = async (password: string): Promise<boolean> => {
  try {
    const session = await init(password)  
    invalidate(session)
    return true
  } catch {
    return false
  }
}

const encodeSessionData = (data: SlotDataState): string => {
  return JSON.stringify(data)
}

export const decodeSessionData = (data: string): SlotDataState | undefined => {
	try {
		if (data.length === 0) return undefined
		const json: unknown = JSON.parse(data)
		if (isObject(json) === false) throw new Error("SlotData does not contain a valid JSON object")
		const { nameKey, fingerprintedName, keyPair: _keyPair } = json
		const keyPair = parseKeyPairAsJSON(_keyPair as KeyPairAsJSON)
		if (isNameKey(nameKey) === false) throw new Error("SlotData does not contain a valid nameKey")
		if (isFingerprintedName(fingerprintedName) === false) throw new Error("SlotData does not contain a valid fingerprintedName")
		if (isKeyPairDisplay(keyPair) === false) throw new Error("SlotData does not contain a valid keyPair")
		return { nameKey, fingerprintedName, keyPair }
	} catch (error) {
		console.error("Failed to decode SlotData:", error)
		return undefined
	}
}
