import { useContext } from "react"
import { ExtensionStateContext } from "./ExtensionStateProvider.tsx"

const useExtensionState = () => {
  const context = useContext(ExtensionStateContext)

  if (context === undefined) {
    throw new Error("useExtensionState must be used within an ExtensionStateProvider")
  }

  return context
}

export default useExtensionState
