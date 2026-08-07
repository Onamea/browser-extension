import { useEffect, useState } from "react"
import type { PendingRequest } from "@/lib/background/signFlow.ts"
import { ExtensionStateProvider } from "@/lib/hooks/ExtensionStateProvider.tsx"
import useExtensionState from "@/lib/hooks/useExtensionState.ts"
import PassphraseEntryForm from "@/lib/components/PassphraseEntryForm.tsx"
import ContainerDisplay from "@/lib/components/ContainerDisplay.tsx"
import SignConfirmation from "@/lib/components/SignConfirmation.tsx"

import "./App.css"

const AppContent = () => {
  const { state } = useExtensionState()
  const [pendingRequest, setPendingRequest] = useState<PendingRequest>()

  useEffect(() => {
    ;(async () => {
      const response = await browser.runtime.sendMessage({ type: "GET_PENDING_REQUEST" })
      if (response.pendingRequest !== undefined) {
        setPendingRequest(response.pendingRequest)
      }
    })().catch(() => {})
  }, [])

  const handleSignDone = () => {
    setPendingRequest(undefined)
    globalThis.close()
  }

  const handleOpenIndex = () => {
    browser.tabs.create({ url: browser.runtime.getURL("/index.html") })
  }

  if (state.isInitialized === false) return null

  const isUnlocked = state.isUnlocked
  const isInitialized = state.hasContainer || isUnlocked
  const showConfirmationForm = isUnlocked && pendingRequest !== undefined

  return (
    showConfirmationForm
      ? <SignConfirmation pendingRequest={ pendingRequest } onDone={ handleSignDone } />
      : <>
          { isInitialized === false && <p>Not initialized</p> }
          { isInitialized && isUnlocked === false && <PassphraseEntryForm /> }
          { isUnlocked && <ContainerDisplay state={ state } /> }
          <button type="button" onClick={ handleOpenIndex }>Open Key Manager</button>
        </>
  )
}

const App = () => {
  return (
    <ExtensionStateProvider>
      <AppContent />
    </ExtensionStateProvider>
  )
}

export default App
