import { useState } from "react"
import { type SlotData, decodeSlotData } from "../pdec.ts"
import type { SlotState } from "../background/state.ts"

const useSlot = () => {
  const [slotState, setSlotState] = useState<SlotState>()

  const setSlot = (slot: SlotData) => {
    const slotData = decodeSlotData(slot)
    setSlotState({ slot, slotData })
  }

  return [slotState, setSlot] as const
}

export default useSlot
