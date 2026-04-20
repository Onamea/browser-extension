import type { SlotData } from "@mikeobank/pdec"
import { useState } from "react"
import "./App.css"
import PassphraseEntryForm from "../../lib/components/PassphraseEntryForm.tsx"
import SlotDisplay from "../../lib/components/SlotDisplay.tsx"

const App = () => {
  const [slot, setSlot] = useState<SlotData>()
  return (
    <>
      { slot === undefined && <PassphraseEntryForm setSlot={ setSlot } /> }
      { slot !== undefined && <SlotDisplay slot={ slot } /> }
    </>
  )
}

export default App
