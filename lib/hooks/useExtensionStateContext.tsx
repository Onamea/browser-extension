import { createContext, useContext, type ReactNode } from "react"
import type { ContainerData } from "@/lib/background/ContainerData.ts"
import type { ExtensionState } from "../background/state.ts"
import useExtensionState from "./useExtensionState.ts"

type ExtensionStateContextValue = {
  state: ExtensionState
  createContainer: (password: string) => Promise<boolean>
  signIn: (password: string) => Promise<boolean>
  writeData: (data: ContainerData) => Promise<boolean>
  clearData: () => Promise<boolean>
  signOut: () => Promise<void>
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
