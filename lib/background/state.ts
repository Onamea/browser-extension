import type { NameKey, FingerprintedName, KeyPairDisplay } from "@vanice/types"
import { type SlotData, decodeSlotData } from "../pdec.ts"

export type SlotDataState = {
  nameKey: NameKey
  fingerprintedName: FingerprintedName
  keyPair: KeyPairDisplay
}

export type SlotState = {
  slot: SlotData
  slotData?: SlotDataState
}

let slotState: SlotState | undefined

export const getSlot = () => slotState
export const setSlot = (slot: SlotData) => {
  const slotData = decodeSlotData(slot)
  slotState = { slot, slotData }
}
