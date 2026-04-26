import { displaySlotData } from "../pdec.ts"
import type { SlotState } from "../background/state.ts"
import SlotDataDisplay from "./SlotDataStateDisplay.tsx"

type Props = {
  slotState: SlotState
}

const SlotDisplay = ({ slotState }: Props) => {

  return (
    <div>
      { slotState.slotData !== undefined 
        ? <SlotDataDisplay slotData={ slotState.slotData } />
        : <p>
            { Object.keys(slotState.slot.data).length === 0 
              ? "Slot is empty"
              : `Slot contains invalid data (${ displaySlotData(slotState.slot) })`
            }
          </p>
      }
    </div>
  )
}

export default SlotDisplay
