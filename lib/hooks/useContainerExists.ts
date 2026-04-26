import { useEffect, useState } from "react"
import { openContainer } from "../pdec.ts"

const useContainerExists = () => {
  const [containerExists, setContainerExists] = useState<boolean | undefined>()
  
  useEffect(() => {
    (async () => {
      const exists = await openContainer()
      setContainerExists(exists)
    })().catch(() => {})
  }, [])

  return [containerExists, setContainerExists] as const
}

export default useContainerExists
