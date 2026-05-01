import type { SlotData } from "@mikeobank/pdec"
import { useEffect } from "react"
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from "react-router-dom"
import useExtensionState from "@/lib/hooks/useExtensionState.ts"
import Signin from "@/lib/routes/Signin.tsx"
import Init from "@/lib/routes/Init.tsx"
import Account from "@/lib/routes/Account.tsx"
import AccountEdit from "@/lib/routes/AccountEdit.tsx"

import "./App.css"

const AppRoutes = () => {

  const { state: { containerExists, slot: slotState }, setSlot, clearSlot } = useExtensionState()
  const isUnlocked = slotState !== undefined
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
        navigate("/account")
      }
    }
  }, [containerExists, isUnlocked, navigate, location.pathname])

  const handleSetSlot = async (slot: SlotData) => {
    await setSlot(slot)
  }

  // Wait for async container check before rendering routes
  if (containerExists === undefined) return null

  return (
    <Routes>
      <Route path="/" element={ null } />
      <Route path="/signin" element={ <Signin setSlot={ handleSetSlot } /> } />
      <Route path="/init" element={ <Init setSlot={ handleSetSlot } /> } />
      <Route path="/account" element={ isUnlocked ? <Account slotState={ slotState } /> : null } />
      <Route path="/account/edit" element={ isUnlocked ? <AccountEdit slotState={ slotState } setSlot={ setSlot } clearSlot={ clearSlot } /> : null } />
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
