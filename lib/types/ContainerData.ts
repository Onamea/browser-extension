import type { NameKey, KeyPairDisplay, KeyPairAsJSON } from "@onamea/types"
import { isKeyPairDisplay, isNameKey, parseKeyPairAsJSON } from "@onamea/types"
import { parseMiningResult } from "@/lib/types/MiningResult.ts"
import isObject from "../utils/isObject.ts"

type Entry = {
  nameKey: NameKey
  keyPair: KeyPairDisplay
}
export type ContainerDataEntry = Entry
export type ContainerData = {
  identity: Entry
  subKeys: Entry[]
}

const parseEntry = (value: unknown): Entry => {
  if (isObject(value) === false) throw new Error("Value does not contain a valid JSON object")
  const { nameKey, keyPair: keyPairAsJSON } = value
  if (isNameKey(nameKey) === false) throw new Error("Value does not contain a valid nameKey")
  const keyPair = parseKeyPairAsJSON(keyPairAsJSON as KeyPairAsJSON)
  if (isKeyPairDisplay(keyPair) === false) throw new Error("Value does not contain a valid keyPair")
  return { nameKey, keyPair }
}

const parseContainerData = (value: unknown): ContainerData => {
  if (isObject(value) === false) throw new Error("Value does not contain a valid JSON object")
  const { identity, subKeys } = value
  if (isObject(identity) === false) throw new Error("Value does not contain a valid identity object")
  if (Array.isArray(subKeys) === false) throw new Error("Value does not contain a valid subKeys array")
  return {
    identity: parseEntry(identity),
    subKeys: subKeys.map(parseEntry)
  }
}

export const encodeSessionData = (data: ContainerData): string => {
  return JSON.stringify(data)
}

export const decodeSessionData = (data: string): ContainerData | undefined => {
  try {
    if (data.length === 0) return undefined
    const json: unknown = JSON.parse(data)
    return parseContainerData(json)
  } catch (error) {
    console.error("Failed to decode Data:", error)
    return undefined
  }
}

const buildEntryFromMiningResult = (result: unknown): Entry => {
  const { nameKey, ...keyPair } = parseMiningResult(result)
  return { nameKey, keyPair }
}

export const buildContainerDataEntryFromMiningResult = (result: unknown): ContainerDataEntry => {
  return buildEntryFromMiningResult(result)
}

export const findEntryInContainerData = (data: ContainerData, nameKey: NameKey): ContainerDataEntry | undefined => {
  if (data.identity.nameKey === nameKey) {
    return data.identity
  }
  return data.subKeys.find(entry => entry.nameKey === nameKey)
}
