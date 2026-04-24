import type { SlotData } from "@mikeobank/pdec"
import type { NameKey, FingerprintedName, KeyPair } from "@vanice/types"

export type SlotDataState = {
  nameKey: NameKey
  fingerprintedName: FingerprintedName
  keyPair: KeyPair
}

export type UnlockedState = {
  slot: SlotData
  slotData?: SlotDataState
}

let containerExists = false
let unlocked: UnlockedState | undefined

export const getContainerExists = () => containerExists
export const setContainerExists = (value: boolean) => { containerExists = value }
export const getUnlocked = () => unlocked
export const setUnlocked = (state: UnlockedState) => { unlocked = state }
