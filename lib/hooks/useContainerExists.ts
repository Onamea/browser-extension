import { useEffect, useState } from "react"
import { checkStorage } from "../container/main.ts"

const useContainerExists = () => {
  const [containerExists, setContainerExists] = useState<boolean | undefined>()
  
  useEffect(() => {
    (async () => {
      const exists = await checkStorage()
      setContainerExists(exists)
    })().catch(() => {})
  }, [])

  return [containerExists, setContainerExists] as const
}

export default useContainerExists
