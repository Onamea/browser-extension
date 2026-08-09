import { ExtensionStateProvider } from "@/lib/hooks/ExtensionStateProvider.tsx"
import useExtensionState from "@/lib/hooks/useExtensionState.ts"
import usePendingRequest from "@/lib/hooks/usePendingRequest.ts"
import PassphraseEntryForm from "@/lib/components/PassphraseEntryForm.tsx"
import ContainerDisplay from "@/lib/components/ContainerDisplay.tsx"
import SignConfirmation from "@/lib/components/SignConfirmation.tsx"

import "./App.css"

const AppContent = () => {
  const { state } = useExtensionState()
  const { pendingRequest } = usePendingRequest()

  const handleOpenIndex = () => {
    browser.tabs.create({ url: browser.runtime.getURL("/index.html") })
  }

  if (state.isInitialized === false) return null

  const isUnlocked = state.isUnlocked
  const isInitialized = state.hasContainer || isUnlocked

  if (isUnlocked && pendingRequest !== undefined) {
    return <SignConfirmation pendingRequest={ pendingRequest } />
  }

  return (
    <>
      { isInitialized === false && <p>Extension not set up, yet</p> }
      { isInitialized && isUnlocked === false && <PassphraseEntryForm /> }
      { isUnlocked && <ContainerDisplay state={ state } /> }
      <button type="button" onClick={ handleOpenIndex }>Open App</button>
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
