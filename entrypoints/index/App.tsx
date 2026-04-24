import type { SlotData } from "@mikeobank/pdec"
import { useEffect } from "react"
import { MemoryRouter, Route, Routes, useNavigate } from "react-router-dom"
import useContainerExists from "@/lib/hooks/useContainerExists.ts"
import CreateSlot from "@/lib/routes/CreateSlot.tsx"
import Signin from "@/lib/routes/Signin.tsx"
import Slot from "@/lib/routes/Slot.tsx"
import useSlot from "@/lib/hooks/useSlot.ts"

import "./App.css"

const AppRoutes = () => {

  const containerExists = useContainerExists()
  const [slotState, setSlot] = useSlot()
  const navigate = useNavigate()

  useEffect(() => {
    if (containerExists === undefined) return
    navigate(containerExists === false ? "/account/edit" : "/signin")
  }, [containerExists, navigate])

  useEffect(() => {
    if (slotState === undefined) return
    navigate("/")
  }, [slotState, navigate])

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
    setSlot(slot)
  }

  // Wait for async container check before rendering routes
  if (containerExists === undefined) return null

  return (
    <Routes>
      <Route path="/" element={ slotState !== undefined ? <Slot slotState={ slotState } setSlot={ setSlot } /> : null } />
      <Route path="/signin" element={ <Signin setSlot={ handleSetSlot } /> } />
      <Route path="/account/edit" element={ <CreateSlot setSlot={ handleSetSlot } /> } />
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
