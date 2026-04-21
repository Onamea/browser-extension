import { Link } from "react-router-dom"
import PassphraseEntryForm from "@/lib/components/PassphraseEntryForm.tsx"
import type { SlotData } from "@mikeobank/pdec"

type Props = {
  setSlot: (slot: SlotData, passphrase: string) => void
}

const Signin = ({ setSlot }: Props) => {
  return (
    <div>
      <h1>Sign in</h1>
      <PassphraseEntryForm setSlot={ setSlot } />
      <div style={ { marginTop: "1rem" } }>
        <Link to="/create-slot">Create slot</Link>
      </div>
    </div>
  )
}

export default Signin
