import { type SlotData, computeLayout, CONTAINER_METADATA_SIZE, OPFSHandle, PDECContainer } from "@mikeobank/pdec"
import type { SlotDataState } from "./background/state"
import isObject from "./utils/isObject"
import { isFingerprintedName, isKeyPair, isNameKey } from "@vanice/types"

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
  if (container === undefined) {
    const layout = computeLayout({ metadataBytes: CONTAINER_METADATA_SIZE })
    const handle = await OPFSHandle.create("vault.pdec", layout.totalSize)
    container = await PDECContainer.create(handle, layout)
  }
  const encodedData = new TextEncoder().encode(data)
  return await container.write(secret, encodedData)
}

export const decodeSlotData = (slot: SlotData): SlotDataState | undefined => {
  const str = new TextDecoder().decode(slot.data)
  try {
    const json: unknown = JSON.parse(str)
    if (isObject(json) === false) throw new Error("SlotData does not contain a valid JSON object")
    if (isNameKey(json.nameKey) === false) throw new Error("SlotData does not contain a valid nameKey")
    if (isFingerprintedName(json.fingerprintedName) === false) throw new Error("SlotData does not contain a valid fingerprintedName")
    if (isKeyPair(json.keyPair) === false) throw new Error("SlotData does not contain a valid keyPair")
    const { nameKey, fingerprintedName, keyPair } = json
    return { nameKey, fingerprintedName, keyPair }
  } catch (_) {
    return undefined
  }
}
