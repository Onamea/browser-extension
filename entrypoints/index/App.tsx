import useExtensionState from "@/lib/hooks/useExtensionState.ts"
import { ExtensionStateProvider } from "@/lib/hooks/ExtensionStateProvider.tsx"
import useView, { ViewProvider } from "@/lib/hooks/useView.tsx"
import SignIn from "@/lib/routes/SignIn.tsx"
import CreateContainer from "@/lib/routes/CreateContainer.tsx"
import Container from "@/lib/routes/Container.tsx"
import Account from "@/lib/routes/Account.tsx"
import AccountEdit from "@/lib/routes/AccountEdit.tsx"
import AccountCreate from "@/lib/routes/AccountCreate.tsx"
import OutOfSyncErrorDisplay from "@/lib/components/OutOfSyncErrorDisplay.tsx"

const AppRoutes = () => {
  const { state } = useExtensionState()
  const { view } = useView()

  if (state.isInitialized === false) return null

  if (state.container.hasContainer === false) {
    return <CreateContainer />
  }

  if (state.container.isUnlocked === false) {
    return <SignIn />
  }

  if (state.local.identity === undefined) {
    return <AccountCreate />
  }

  switch (view) {
    case "account":
      return <Account state={ state } />
    case "accountEdit":
      return <AccountEdit state={ state } />
    case "container":
      return <Container state={ state } />
  }
}

const AppContent = () => {
  const { state } = useExtensionState()
  const hasActiveIdentity = state.isInitialized &&
    state.container.hasContainer &&
    state.container.isUnlocked &&
    state.local.identity !== undefined

  return (
    <>
      { state.isInSync === false && <OutOfSyncErrorDisplay /> }
      <ViewProvider key={ hasActiveIdentity ? "active-identity" : "no-active-identity" }>
        <AppRoutes />
      </ViewProvider>
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
