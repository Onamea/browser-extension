import usePendingRequest from "@/lib/hooks/usePendingRequest.ts"
import { ExtensionStateProvider } from "@/lib/hooks/ExtensionStateProvider.tsx"
import useExtensionState from "@/lib/hooks/useExtensionState.ts"
import PassphraseEntryForm from "@/lib/components/PassphraseEntryForm.tsx"
import ContainerDisplay from "@/lib/components/ContainerDisplay.tsx"
import SignConfirmation from "@/lib/components/SignConfirmation.tsx"

import "./App.css"

const AppContent = () => {
  const { state } = useExtensionState()
  const { pendingRequest, clearPendingRequest } = usePendingRequest()

  const handleSignDone = () => {
    clearPendingRequest()
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
