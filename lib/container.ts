import type { NameKey, FingerprintedName, KeyPairDisplay, KeyPairAsJSON } from "@vanice/types"
import { isFingerprintedName, isKeyPairDisplay, isNameKey, parseKeyPairAsJSON } from "@vanice/types"
import { type AccessKey, create, initialize, deinitialize, set } from "./container/main.ts"
import isObject from "./utils/isObject.ts"

export type ContainerData = {
  nameKey: NameKey
  fingerprintedName: FingerprintedName
  keyPair: KeyPairDisplay
}

export type SessionResult = {
  content: string
	accessKey: AccessKey
}

export const createSession = async (password: string): Promise<SessionResult | undefined> => {
	try {
		await create(password)
		const result = await initialize(password)
		if (result.hasContainer === false || result.content === undefined || result.accessKey === undefined) {
			return undefined
		}
		return {
			content: result.content,
			accessKey: result.accessKey
		}
	} catch (error) {
		console.error("Failed to create session:", error)
		return undefined
	}
}

export const readSession = async (password: string): Promise<SessionResult | undefined> => {
	try {
		const result = await initialize(password)
		if (result.hasContainer === false || result.content === undefined || result.accessKey === undefined) {
			return undefined
		}
		return {
			content: result.content,
			accessKey: result.accessKey
		}
	} catch (error) {
		console.error("Failed to read session:", error)
		return undefined
	}
}

export const writeSession = async (accessKey: string, data?: ContainerData): Promise<boolean> => {
	try {
		await set(accessKey, data ? encodeSessionData(data) : "")
		return true
	} catch (error) {
    console.error("Failed to write session:", error)
    return false
	}
}

export const clearSession = async (accessKey: string): Promise<boolean> => {
	try {
		await set(accessKey, "")
		return true
	} catch (error) {
		console.error("Failed to clear session:", error)
		return false
	}
}

export const invalidateSession = (): boolean => {
  try {
    deinitialize()
    return true
  } catch (error) {
    console.error("Failed to invalidate session:", error)
    return false
  }
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
