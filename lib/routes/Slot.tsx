import { 
  type MnemonicDisplayWithPassphrase, 
  type PrivateKeyDisplay, 
  isNameKey, 
  nameKeyToFingerprintedName 
} from "@vanice/types"
import type { Identifier } from "@vanice/crdt"
import { identify } from "@vanice/crdt"
import { type SlotData } from "../pdec.ts"
import type { SlotState } from "../background/state.ts"
import SlotDisplay from "@/lib/components/SlotDisplay.tsx"
import AddKeyPairForm from "@/lib/components/AddKeyPairForm.tsx"

type Props = {
  slotState: SlotState
  setSlot: (slot: SlotData) => void
}

const Slot = ({ slotState, setSlot }: Props) => {

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
      setSlot(response.slot)
    } catch (error) {
      console.error("Failed to identify key pair:", error)
    }
  }

  return (
    <div>
      <h1>Slot</h1>
      <SlotDisplay slotState={ slotState } />
      { slotState.slotData === undefined && <AddKeyPairForm onSubmit={ addKeyPair } /> }
    </div>
  )
}

export default Slot
