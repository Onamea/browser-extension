import type { SlotData } from "@mikeobank/pdec"
import { useEffect, useState } from "react"
import { MemoryRouter, Route, Routes, useNavigate } from "react-router-dom"

import { openContainer } from "@/lib/pdec.ts"
import CreateSlot from "@/lib/routes/CreateSlot.tsx"
import Signin from "@/lib/routes/Signin.tsx"
import Slot from "@/lib/routes/Slot.tsx"

import "./App.css"

const AppRoutes = () => {
  const [slot, setSlot] = useState<SlotData>()
  const [containerExists, setContainerExists] = useState<boolean | undefined>()
  const navigate = useNavigate()

  useEffect(() => {
    openContainer().then(exists => {
      setContainerExists(exists)
    })
  }, [])

  const handleSetSlot = async (slotData: SlotData, passphrase: string) => {
    const str = new TextDecoder().decode(slotData.data)
    try {
      const json = JSON.parse(str)
      if (json.keyPair !== undefined) {
        await browser.runtime.sendMessage({ type: "UNLOCK", slotData, keyPair: json.keyPair, passphrase })
      }
    } catch (_) {
      // slot data may not contain a key pair
    }
    await browser.runtime.sendMessage({ type: "SET_CONTAINER_EXISTS" })
    setSlot(slotData)
    navigate("/slot")
  }

  if (containerExists === undefined) return null

  return (
    <Routes>
      <Route path="/" element={ containerExists === false ? <CreateSlot setSlot={ handleSetSlot } /> : <Signin setSlot={ handleSetSlot } /> } />
      <Route path="/slot" element={ slot !== undefined ? <Slot slot={ slot } setSlot={ slotData => setSlot(slotData) }/> : <Signin setSlot={ handleSetSlot } /> } />
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
