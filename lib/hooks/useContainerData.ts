import { useState } from "react"
import type { ContainerData } from "../container.ts"

const useContainerData = () => {
  const [state, setState] = useState<ContainerData | undefined>()

  const setContainerData = (data: ContainerData) => {
    setState(data)
  }

  return [state, setContainerData] as const
}

export default useContainerData
