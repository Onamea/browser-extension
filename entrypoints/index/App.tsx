import { MemoryRouter, Route, Routes, useLocation, useNavigate } from "react-router-dom"
import useExtensionState from "@/lib/hooks/useExtensionState.ts"
import { ExtensionStateProvider } from "@/lib/hooks/ExtensionStateProvider.tsx"
import SignIn from "@/lib/routes/SignIn.tsx"
import CreateContainer from "@/lib/routes/CreateContainer.tsx"
import Account from "@/lib/routes/Account.tsx"
import AccountEdit from "@/lib/routes/AccountEdit.tsx"

import "./App.css"

const AppRoutes = () => {
  const { state } = useExtensionState()
  const { hasContainer, isInitialized, isUnlocked, data } = state
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (isInitialized === false) return
    if (hasContainer === false) {
      navigate("/init")
    } else if (isUnlocked === false) {
      navigate("/signin")
    } else {
      if (location.pathname.startsWith("/account") === false) {
        if (data === undefined) {
          navigate("/account/edit")
        } else {
          navigate("/account")
        }
      }
    }
  }, [isInitialized, hasContainer, isUnlocked, navigate, location.pathname, data])

  // Wait for async container check before rendering routes
  if (isInitialized === false) return null

  return (
    <Routes>
      <Route path="/" element={ null } />
      <Route path="/signin" element={ <SignIn /> } />
      <Route path="/init" element={ <CreateContainer /> } />
      <Route path="/account" element={ isUnlocked ? <Account state={ state } /> : null } />
      <Route path="/account/edit" element={ isUnlocked ? <AccountEdit state={ state } /> : null } />
    </Routes>
  )
}

const App = () => {
  return (
    <ExtensionStateProvider>
      <MemoryRouter initialEntries={ ["/"] }>
        <AppRoutes />
      </MemoryRouter>
    </ExtensionStateProvider>
  )
}

export default App
