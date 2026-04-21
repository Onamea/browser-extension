import type { SlotData } from "@mikeobank/pdec"
import { useEffect, useState } from "react"
import PassphraseEntryForm from "@/lib/components/PassphraseEntryForm.tsx"
import SlotDisplay from "@/lib/components/SlotDisplay.tsx"
import SignConfirmation from "@/lib/components/SignConfirmation.tsx"
import { decodeSlotData, openContainer } from "@/lib/pdec.ts"
import type { PendingRequest } from "@/lib/background/signFlow.ts"

import "./App.css"

const App = () => {

  const [containerExists, setContainerExists] = useState<boolean>()
  const [unlocked, setUnlocked] = useState(false)
  const [slot, setSlot] = useState<SlotData>()

  const [pendingRequest, setPendingRequest] = useState<PendingRequest>()

  useEffect(() => {
    (async () => {
      const exists = await openContainer()
      setContainerExists(exists)
      const response = await browser.runtime.sendMessage({ type: "GET_PENDING_REQUEST" }) as { pendingRequest: PendingRequest | null, unlocked: boolean, slotData: SlotData | null }
      setUnlocked(response.unlocked)
      if (response.slotData !== null) {
        setSlot(response.slotData)
      }
      if (response.pendingRequest !== null) {
        setPendingRequest(response.pendingRequest)
      }
    })().catch(() => {})
  }, [])

  const handleSetSlot = async (slotData: SlotData, passphrase: string) => {
    try {
      const json = decodeSlotData(slotData)
      const keyPair = (json as { keyPair?: unknown }).keyPair
      if (keyPair !== undefined) {
        await browser.runtime.sendMessage({ type: "UNLOCK", passphrase, slotData, keyPair })
      }
    } catch (_) {
      // slot data may not contain a key pair
    }
    setSlot(slotData)
  }

  const handleSignDone = () => {
    setPendingRequest(undefined)
    globalThis.close()
  }

  const handleOpenIndex = () => {
    browser.tabs.create({ url: browser.runtime.getURL("/index.html") })
  }

  const isUnlocked = slot !== undefined || unlocked
  const showConfirmationForm = isUnlocked && pendingRequest !== undefined

  return (
    showConfirmationForm
      ? <SignConfirmation pendingRequest={ pendingRequest } onDone={ handleSignDone } />
      : <>
          { containerExists === false && <button type="button" onClick={ handleOpenIndex }>Open Key Manager</button> }
          { containerExists === true && slot === undefined && <PassphraseEntryForm setSlot={ handleSetSlot } /> }
          { slot !== undefined && <SlotDisplay slot={ slot } /> }
        </>
  )
}

export default App
