import type { SlotData } from "@mikeobank/pdec"
import type { KeyPairAsJSON } from "@vanice/types"

export type UnlockedState = {
  slotData: SlotData
  keyPair: KeyPairAsJSON
  passphrase: string
}

let containerExists = false
let unlocked: UnlockedState | undefined

export const getContainerExists = () => containerExists
export const setContainerExists = (value: boolean) => { containerExists = value }
export const getUnlocked = () => unlocked
export const setUnlocked = (state: UnlockedState) => { unlocked = state }
