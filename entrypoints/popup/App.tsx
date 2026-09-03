import { ExtensionStateProvider } from "@/lib/hooks/ExtensionStateProvider.tsx"
import PassphraseEntryForm from "@/lib/components/PassphraseEntryForm.tsx"
import ContainerDisplay from "@/lib/components/ContainerDisplay.tsx"
import SignConfirmationDisplay from "@/lib/components/SignConfirmationDisplay.tsx"
import SignRequestResultsDisplay from "@/lib/components/SignRequestResultsDisplay.tsx"
import useExtensionState from "@/lib/hooks/useExtensionState.ts"
import usePendingRequest from "@/lib/hooks/usePendingRequest.ts"
import OutOfSyncErrorDisplay from "@/lib/components/OutOfSyncErrorDisplay.tsx"

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
  const { isInitialized } = state
  const { hasContainer, isUnlocked } = state.container
  const { pendingRequest, signRequestResults, clearPendingRequest, clearSignRequestResults, refreshPendingRequest } = usePendingRequest(isUnlocked)

  const handleOpenIndex = () => {
    browser.tabs.create({ url: browser.runtime.getURL("/index.html") })
  }

  if (isInitialized === false) {
    return null
  } else if (isUnlocked && pendingRequest !== undefined) {
    return <SignConfirmationDisplay pendingRequest={ pendingRequest } clearPendingRequest={ clearPendingRequest } refreshPendingRequest={ refreshPendingRequest } />
  } else if (isUnlocked && signRequestResults.length > 0) {
    return <SignRequestResultsDisplay results={ signRequestResults } onDismiss={ clearSignRequestResults } />
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
        { state.isInSync === false && <OutOfSyncErrorDisplay /> }
        <ContainerDisplay container={ state.container } />
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
