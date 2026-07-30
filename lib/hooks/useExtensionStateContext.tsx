import { createContext, useContext, type ReactNode } from "react"
import type { AccessKey } from "@/lib/container/main.ts"
import type { ExtensionState } from "../background/state.ts"
import useExtensionState from "./useExtensionState.ts"

type ExtensionStateContextValue = {
  state: ExtensionState
  setContainerExists: (value: boolean | undefined) => Promise<void>
  setAccessKey: (accessKey: AccessKey | undefined) => Promise<void>
  setData: (data: string, accessKey?: string) => Promise<void>
  clearData: () => Promise<void>
}

const ExtensionStateContext = createContext<ExtensionStateContextValue | undefined>(undefined)

type Props = {
  children: ReactNode
}

export const ExtensionStateProvider = ({ children }: Props) => {
  const value = useExtensionState()

  return (
    <ExtensionStateContext.Provider value={ value }>
      { children }
    </ExtensionStateContext.Provider>
  )
}

export const useExtensionStateContext = () => {
  const context = useContext(ExtensionStateContext)

  if (context === undefined) {
    throw new Error("useExtensionStateContext must be used within an ExtensionStateProvider")
  }

  return context
}
