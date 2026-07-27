import { useEffect, useState } from "react"
import type { PendingRequest } from "@/lib/background/signFlow.ts"
import PassphraseEntryForm from "@/lib/components/PassphraseEntryForm.tsx"
import ContainerDisplay from "@/lib/components/ContainerDisplay.tsx"
import SignConfirmation from "@/lib/components/SignConfirmation.tsx"
import useExtensionState from "@/lib/hooks/useExtensionState.ts"

import "./App.css"

const App = () => {

  const { state, setData } = useExtensionState()
  const containerExists = state.containerExists
  const [pendingRequest, setPendingRequest] = useState<PendingRequest>()

  useEffect(() => {
    (async () => {
      const response = await browser.runtime.sendMessage({ type: "GET_PENDING_REQUEST" })
      if (response.pendingRequest !== undefined) {
        setPendingRequest(response.pendingRequest)
      }
    })().catch(() => {})
  }, [])

  const handleSetData = async (data: string) => {
    await setData(data)
  }

  const handleSignDone = () => {
    setPendingRequest(undefined)
    globalThis.close()
  }

  const handleOpenIndex = () => {
    browser.tabs.create({ url: browser.runtime.getURL("/index.html") })
  }

  if (containerExists === undefined) return null

  const isUnlocked = state.raw !== undefined
  const isInitialized = isUnlocked || containerExists === true
  const showConfirmationForm = isUnlocked && pendingRequest !== undefined

  return (
    showConfirmationForm
      ? <SignConfirmation pendingRequest={ pendingRequest } onDone={ handleSignDone } />
      : <>
          { isInitialized === false && <p>Not initialized</p> }
          { isInitialized && isUnlocked === false && <PassphraseEntryForm setData={ handleSetData } /> }
          { isUnlocked && <ContainerDisplay state={ state } /> }
          <button type="button" onClick={ handleOpenIndex }>Open Key Manager</button>
        </>
  )
}

export default App
