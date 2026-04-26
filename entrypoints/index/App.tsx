import type { SlotData } from "@mikeobank/pdec"
import { useEffect } from "react"
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from "react-router-dom"
import useContainerExists from "@/lib/hooks/useContainerExists.ts"
import Signin from "@/lib/routes/Signin.tsx"
import Init from "@/lib/routes/Init"
import Account from "@/lib/routes/Account.tsx"
import AccountEdit from "@/lib/routes/AccountEdit.tsx"
import useSlot from "@/lib/hooks/useSlot.ts"

import "./App.css"

const AppRoutes = () => {

  const [containerExists, setContainerExists] = useContainerExists()
  const [slotState, setSlot] = useSlot()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (containerExists === undefined) return
    if (containerExists === false) {
      navigate("/init")
    } else if (slotState === undefined) {
      navigate("/signin")
    } else {
      if (location.pathname.startsWith("/account") === false) {
        navigate("/account")
      }
    }
  }, [containerExists, slotState, navigate, location.pathname])

  useEffect(() => {
    (async () => {
      const response = await browser.runtime.sendMessage({ type: "GET_PENDING_REQUEST" })
      if (response.slot !== undefined) {
        setSlot(response.slot)
      }
    })().catch(() => {})
  }, [])

  const handleSetSlot = async (slot: SlotData) => {
    await browser.runtime.sendMessage({ type: "SET_SLOT", slot })
    setContainerExists(true)
    setSlot(slot)
  }

  // Wait for async container check before rendering routes
  if (containerExists === undefined) return null

  return (
    <Routes>
      <Route path="/" element={ null } />
      <Route path="/signin" element={ <Signin setSlot={ handleSetSlot } /> } />
      <Route path="/init" element={ <Init setSlot={ handleSetSlot } /> } />
      <Route path="/account" element={ slotState !== undefined ? <Account slotState={ slotState } /> : null } />
      <Route path="/account/edit" element={ slotState !== undefined ? <AccountEdit slotState={ slotState } setSlot={ setSlot } /> : null } />
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
