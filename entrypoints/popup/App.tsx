import { ExtensionStateProvider } from "@/lib/hooks/ExtensionStateProvider.tsx"
import PassphraseEntryForm from "@/lib/components/PassphraseEntryForm.tsx"
import ContainerDisplay from "@/lib/components/ContainerDisplay.tsx"
import SignConfirmation from "@/lib/components/SignConfirmation.tsx"
import useExtensionState from "@/lib/hooks/useExtensionState.ts"
import usePendingRequest from "@/lib/hooks/usePendingRequest.ts"

import "./App.css"

const AppButton = ({ onClick, children }: { onClick: () => void; children: React.ReactNode }) => {
  return (
    <button type="button" onClick={ onClick }>
      { children }
    </button>
  )
}

const AppContent = () => {

  const { state } = useExtensionState()
  const { isInitialized, hasContainer, isUnlocked } = state
  const { pendingRequest } = usePendingRequest()

  const handleOpenIndex = () => {
    browser.tabs.create({ url: browser.runtime.getURL("/index.html") })
  }

  if (isInitialized === false) {
    return null
  } else if (isUnlocked && pendingRequest !== undefined) {
    return <SignConfirmation pendingRequest={ pendingRequest } />
  } else if (hasContainer === false) {
    return (
      <>
        <p>Extension not set up, yet</p>
        <AppButton onClick={ handleOpenIndex }>Open App to set up</AppButton>
      </>
    )
  } else if (hasContainer && isUnlocked === false) {
    return <PassphraseEntryForm />
  } else if (isUnlocked) {
    return (
      <>
        <ContainerDisplay state={ state } />
        <AppButton onClick={ handleOpenIndex }>Open App</AppButton>
      </>
    )
  }
}

const App = () => {
  return (
    <ExtensionStateProvider>
      <AppContent />
    </ExtensionStateProvider>
  )
}

export default App
