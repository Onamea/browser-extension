import type { SlotData } from "@mikeobank/pdec"
import { useState } from "react"
import { MemoryRouter, Route, Routes, useNavigate } from "react-router-dom"

import CreateSlot from "@/lib/routes/CreateSlot.tsx"
import Signin from "@/lib/routes/Signin.tsx"
import Slot from "@/lib/routes/Slot.tsx"

import "./App.css"

const AppRoutes = () => {
  const [slot, setSlot] = useState<SlotData>()
  const navigate = useNavigate()

  const handleSetSlot = (slotData: SlotData) => {
    setSlot(slotData)
    navigate("/slot")
  }

  return (
    <Routes>
      <Route path="/" element={ <Signin setSlot={ handleSetSlot } /> } />
      <Route path="/create-slot" element={ <CreateSlot setSlot={ handleSetSlot } /> } />
      <Route path="/slot" element={ slot !== undefined ? <Slot slot={ slot } setSlot={ handleSetSlot }/> : <Signin setSlot={ handleSetSlot } /> } />
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
