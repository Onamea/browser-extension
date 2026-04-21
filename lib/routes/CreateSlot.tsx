import type { SlotData } from "@mikeobank/pdec"
import CreatePassphraseForm from "@/lib/components/CreatePassphraseForm.tsx"

type Props = {
  setSlot: (slot: SlotData, passphrase: string) => void
}

const CreateSlot = ({ setSlot }: Props) => {
  return (
    <div>
      <h1>Create slot</h1>
      <CreatePassphraseForm setSlot={ setSlot } />
    </div>
  )
}

export default CreateSlot
