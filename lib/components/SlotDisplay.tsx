import { displaySlotData } from "../pdec.ts"
import type { SlotState } from "../background/state.ts"
import SlotDataDisplay from "./SlotDataStateDisplay.tsx"

type Props = {
  slotState: SlotState
}

const SlotDisplay = ({ slotState }: Props) => {
  const rawSlotData = displaySlotData(slotState.slot)

  return (
    <div>
      { slotState.slotData !== undefined 
        ? <SlotDataDisplay slotData={ slotState.slotData } />
        : <p>
            { rawSlotData.length === 0
              ? "Slot is empty"
              : `Slot contains invalid data (${ rawSlotData })`
            }
          </p>
      }
    </div>
  )
}

export default SlotDisplay
