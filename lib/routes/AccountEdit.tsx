import { 
  type MnemonicDisplayWithPassphrase, 
  type PrivateKeyDisplay, 
  isNameKey, 
  nameKeyToFingerprintedName 
} from "@vanice/types"
import type { Identifier } from "@vanice/crdt"
import { identify } from "@vanice/crdt"
import { useNavigate } from "react-router-dom"
import { type SlotData } from "../pdec.ts"
import type { SlotState } from "../background/state.ts"
import SlotDisplay from "@/lib/components/SlotDisplay.tsx"
import AddKeyPairForm from "@/lib/components/AddKeyPairForm.tsx"
import MineForm from "../components/MineForm.tsx"
import ClearSlotButton from "../components/ClearSlotButton.tsx"

type Props = {
  slotState: SlotState
  setSlot: (slot: SlotData) => Promise<void>
  clearSlot: () => Promise<void>
}

const AccountEdit = ({ slotState, setSlot, clearSlot }: Props) => {

  const navigate = useNavigate()

  const addKeyPair = async (identifier: Identifier, privateKeyOrMnemonic: PrivateKeyDisplay | MnemonicDisplayWithPassphrase, passphrase: string) => {

    try {
      const [nameKey, keyPair] = await identify(identifier, privateKeyOrMnemonic)
      if (isNameKey(nameKey) === false) {
        throw new Error("Identifier is not a NameKey")
      }
      const fingerprintedName = await nameKeyToFingerprintedName(nameKey)
      const data = {
        nameKey,
        fingerprintedName,
        keyPair
      }
      const response = await browser.runtime.sendMessage(
        { type: "WRITE_SLOT", data, passphrase }
      )
      if (response.slot === undefined) {
        throw new Error(response.error ?? "WRITE_SLOT failed")
      }
      await setSlot(response.slot)
    } catch (error) {
      console.error("Failed to identify key pair:", error)
    }
  }

  const onClick = () => {
    navigate("/account")
  }

  return (
    <div>
      <h1>Slot</h1>
      <SlotDisplay slotState={ slotState } />
      { slotState.slotData !== undefined && <ClearSlotButton onClearSlot={ clearSlot } /> }
      { slotState.slotData === undefined && <AddKeyPairForm onSubmit={ addKeyPair } /> }
      { slotState.slotData === undefined && <MineForm onSubmit={ async () => {} } /> }
      <button type="button" onClick={ onClick }>cancel</button>
    </div>
  )
}

export default AccountEdit
