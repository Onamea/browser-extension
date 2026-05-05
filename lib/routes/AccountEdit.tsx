import { useNavigate } from "react-router-dom"
import { type SlotData } from "../pdec.ts"
import type { SlotState } from "../background/state.ts"
import SlotDisplay from "@/lib/components/SlotDisplay.tsx"
import AddKeyPairForm from "@/lib/components/AddKeyPairForm.tsx"
import CreateKeyPairForm from "../components/CreateKeyPairForm.tsx"
import ClearSlotButton from "../components/ClearSlotButton.tsx"

type Props = {
  slotState: SlotState
  setSlot: (slot: SlotData) => Promise<void>
  clearSlot: () => Promise<void>
}

const AccountEdit = ({ slotState, setSlot, clearSlot }: Props) => {

  const navigate = useNavigate()

  const onClick = () => {
    navigate("/account")
  }

  return (
    <div>
      <h1>Slot</h1>
      <SlotDisplay slotState={ slotState } />
      { slotState.slotData !== undefined && <ClearSlotButton onClearSlot={ clearSlot } /> }
      { slotState.slotData === undefined && <AddKeyPairForm setSlot={ setSlot } /> }
      { slotState.slotData === undefined && <CreateKeyPairForm onSubmit={ async () => {} } /> }
      <button type="button" onClick={ onClick }>cancel</button>
    </div>
  )
}

export default AccountEdit
