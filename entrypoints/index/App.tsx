import { useEffect } from "react"
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from "react-router-dom"
import useExtensionState from "@/lib/hooks/useExtensionState.ts"
import Signin from "@/lib/routes/Signin.tsx"
import Init from "@/lib/routes/Init.tsx"
import Account from "@/lib/routes/Account.tsx"
import AccountEdit from "@/lib/routes/AccountEdit.tsx"

import "./App.css"

const AppRoutes = () => {

  const { state: { containerExists, raw, data }, state, setData, clearData } = useExtensionState()
  const isUnlocked = raw !== undefined
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (containerExists === undefined) return
    if (containerExists === false) {
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
  }, [containerExists, isUnlocked, navigate, location.pathname])

  const handleSetData = async (data: string) => {
    await setData(data)
  }

  // Wait for async container check before rendering routes
  if (containerExists === undefined) return null

  return (
    <Routes>
      <Route path="/" element={ null } />
      <Route path="/signin" element={ <Signin setData={ handleSetData } /> } />
      <Route path="/init" element={ <Init setData={ handleSetData } /> } />
      <Route path="/account" element={ isUnlocked ? <Account state={ state } /> : null } />
      <Route path="/account/edit" element={ isUnlocked ? <AccountEdit state={ state } setData={ handleSetData } clearData={ clearData } /> : null } />
    </Routes>
  )
}

const App = () => {
  return (
    <MemoryRouter initialEntries={ ["/"] }>
      <AppRoutes />
    </MemoryRouter>
  )
}

export default App
