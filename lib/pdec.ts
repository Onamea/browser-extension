import { isFingerprintedName, isKeyPairDisplay, isNameKey, KeyPairAsJSON, parseKeyPairAsJSON } from "@vanice/types"
import { type SlotData, computeLayout, CONTAINER_METADATA_SIZE, OPFSHandle, PDECContainer } from "@mikeobank/pdec"
import type { SlotDataState } from "./background/state.ts"
import isObject from "./utils/isObject.ts"
import { uint8ArrayToString } from "./utils/uint8ArrayToString.ts"

export type { SlotData } from "@mikeobank/pdec"

let container: PDECContainer | undefined

export const openContainer = async (): Promise<boolean> => {
  if (container !== undefined) return true
  try {
    const handle = await OPFSHandle.open("vault.pdec")
    container = await PDECContainer.openHandle(handle)
    return true
  } catch {
    return false
  }
}

export const readSlot = async (secret: string): Promise<SlotData | undefined> => {
  if (container === undefined) return undefined
  return await container.read(secret)
}

export const writeSlot = async (secret: string, data: string): Promise<SlotData> => {
  console.log(data, container)
  if (container === undefined) {
    const layout = computeLayout({ metadataBytes: CONTAINER_METADATA_SIZE })
    const handle = await OPFSHandle.create("vault.pdec", layout.totalSize)
    container = await PDECContainer.create(handle, layout)
  }
  const encodedData = new TextEncoder().encode(data)
  return await container.write(secret, encodedData)
}

export const decodeSlotData = (slot: SlotData): SlotDataState | undefined => {
  try {
    const str = uint8ArrayToString(slot.data)
    if (str.length === 0) return undefined
    const json: unknown = JSON.parse(str)
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

export const displaySlotData = (slot: SlotData): string => {
  return uint8ArrayToString(slot.data)
}
