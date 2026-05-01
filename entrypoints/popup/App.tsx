import type { SlotData } from "@mikeobank/pdec"
import { useEffect, useState } from "react"
import PassphraseEntryForm from "@/lib/components/PassphraseEntryForm.tsx"
import SlotDisplay from "@/lib/components/SlotDisplay.tsx"
import SignConfirmation from "@/lib/components/SignConfirmation.tsx"
import type { PendingRequest } from "@/lib/background/signFlow.ts"
import useExtensionState from "@/lib/hooks/useExtensionState.ts"

import "./App.css"

const App = () => {

  const { state, setSlot } = useExtensionState()
  const containerExists = state.containerExists
  const slotState = state.slot
  const [pendingRequest, setPendingRequest] = useState<PendingRequest>()

  useEffect(() => {
    (async () => {
      const response = await browser.runtime.sendMessage({ type: "GET_PENDING_REQUEST" })
      if (response.pendingRequest !== undefined) {
        setPendingRequest(response.pendingRequest)
      }
    })().catch(() => {})
  }, [])

  const handleSetSlot = async (slot: SlotData) => {
    await setSlot(slot)
  }

  const handleSignDone = () => {
    setPendingRequest(undefined)
    globalThis.close()
  }

  const handleOpenIndex = () => {
    browser.tabs.create({ url: browser.runtime.getURL("/index.html") })
  }

  if (containerExists === undefined) return null

  const isUnlocked = slotState !== undefined
  const isInitialized = isUnlocked || containerExists === true
  const showConfirmationForm = isUnlocked && pendingRequest !== undefined

  return (
    showConfirmationForm
      ? <SignConfirmation pendingRequest={ pendingRequest } onDone={ handleSignDone } />
      : <>
          { isInitialized === false && <p>Not initialized</p> }
          { isInitialized && isUnlocked === false && <PassphraseEntryForm setSlot={ handleSetSlot } /> }
          { isUnlocked && <SlotDisplay slotState={ slotState } /> }
          <button type="button" onClick={ handleOpenIndex }>Open Key Manager</button>
        </>
  )
}

export default App
