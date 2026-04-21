import { isNameKey, nameKeyToFingerprintedName, type PrivateKeyDisplay } from "@vanice/types"
import type { Identifier } from "@vanice/crdt"
import type { SlotData } from "@mikeobank/pdec"
import { identify } from "@vanice/crdt"
import SlotDisplay from "@/lib/components/SlotDisplay.tsx"
import AddKeyPairForm from "@/lib/components/AddKeyPairForm.tsx"

type Props = {
  slot: SlotData
  setSlot: (slot: SlotData) => void
}

const Slot = ({ slot, setSlot }: Props) => {

  const addKeyPair = async (identifier: Identifier, privateKey: PrivateKeyDisplay) => {
    try {
      const [nameKey, keyPair] = await identify(identifier, privateKey)
      if (isNameKey(nameKey) === false) {
        throw new Error("Identifier is not a NameKey")
      }
      const fingerprintedName = await nameKeyToFingerprintedName(nameKey)
      const data = {
        nameKey,
        fingerprintedName,
        keyPair
      }
      console.log(data)
      const response = await browser.runtime.sendMessage({ type: "WRITE_SLOT", data: JSON.stringify(data) }) as { slotData?: SlotData, error?: string }
      if (response.slotData === undefined) {
        throw new Error(response.error ?? "WRITE_SLOT failed")
      }
      setSlot(response.slotData)
    } catch (error) {
      console.error("Failed to identify key pair:", error)
    }
  }

  return (
    <div>
      <h1>Slot</h1>
      <SlotDisplay slot={ slot } />
      { slot.data.length === 0 && <AddKeyPairForm onSubmit={ addKeyPair }/>}
    </div>
  )
}

export default Slot
