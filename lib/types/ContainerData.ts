import type { NameKey, KeyPairDisplay, KeyPairAsJSON } from "@onamea/types"
import { isKeyPairDisplay, isNameKey, parseKeyPairAsJSON } from "@onamea/types"
import { parseMiningResult } from "@/lib/types/MiningResult.ts"
import isObject from "../utils/isObject.ts"

type Entry = {
  nameKey: NameKey
  keyPair: KeyPairDisplay
}
export type ContainerDataEntry = Entry
export type ContainerData = ContainerDataEntry[]

const parseEntry = (value: unknown): Entry => {
  if (isObject(value) === false) throw new Error("Value does not contain a valid JSON object")
  const { nameKey, keyPair: keyPairAsJSON } = value
  if (isNameKey(nameKey) === false) throw new Error("Value does not contain a valid nameKey")
  const keyPair = parseKeyPairAsJSON(keyPairAsJSON as KeyPairAsJSON)
  if (isKeyPairDisplay(keyPair) === false) throw new Error("Value does not contain a valid keyPair")
  return { nameKey, keyPair }
}

const parseContainerData = (value: unknown): ContainerData => {
  if (Array.isArray(value) === false) throw new Error("Value does not contain a valid entries array")
  return value.map(parseEntry)
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

export const buildContainerDataEntryFromMiningResult = (result: unknown): ContainerDataEntry => {
  const { nameKey, ...keyPair } = parseMiningResult(result)
  return { nameKey, keyPair }
}

export const appendContainerDataEntry = (data: ContainerData, entry: ContainerDataEntry): ContainerData => {
  if (findEntryInContainerData(data, entry.nameKey) !== undefined) {
    throw new Error(`Entry for (${ entry.nameKey }) already exists in ContainerData`)
  }
  return [...data, entry]
}

export const findEntryInContainerData = (data: ContainerData, nameKey: NameKey): ContainerDataEntry | undefined => {
  return data.find(entry => entry.nameKey === nameKey)
}
