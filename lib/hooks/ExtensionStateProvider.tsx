import { useEffect, useReducer, type ReactNode, createContext } from "react"
import type { ContainerData } from "@/lib/types/ContainerData.ts"
import { encodeSessionData } from "@/lib/types/ContainerData.ts"
import {
  extensionReducer,
  initialState,
  clearSessionData as clearSessionDataToDispatch,
  setContainerStatus as setContainerStatusToDispatch,
  setSessionData as setSessionDataToDispatch,
  setAccessKey as setAccessKeyToDispatch
} from "../background/state.ts"
import type { ExtensionState } from "../background/state.ts"
import { create, deinitialize, initialize, set } from "@/lib/container/main.ts"
import {
  createContainerState,
  initializeState,
  onStateUpdated,
  signInState,
  signOutState,
  writeStateData
} from "@/lib/messaging/client/stateClient.ts"

export type ExtensionStateContextValue = {
  state: ExtensionState
  createContainer: (password: string) => Promise<boolean>
  signIn: (password: string) => Promise<boolean>
  writeData: (data: ContainerData) => Promise<boolean>
  clearData: () => Promise<boolean>
  signOut: () => Promise<void>
}

export const ExtensionStateContext = createContext<ExtensionStateContextValue | undefined>(undefined)

type Props = {
  children: ReactNode
}

const useExtensionStateStore = () => {
  const [state, dispatch] = useReducer(extensionReducer, initialState)

  useEffect(() => {
    const syncState = (nextState: ExtensionState) => {
      setContainerStatusToDispatch(dispatch, nextState.hasContainer)
      if (nextState.accessKey !== undefined) {
        setAccessKeyToDispatch(dispatch, nextState.accessKey)
      }
      if (nextState.raw !== undefined) {
        setSessionDataToDispatch(dispatch, nextState.raw)
      }
    }

    initializeState().then(stateResponse => {
      if (stateResponse !== undefined) {
        syncState(stateResponse)
      }
    }).catch((error) => {
      console.error("Failed to initialize extension state:", error)
    })

    return onStateUpdated(syncState)
  }, [])

  const createContainer = async (password: string): Promise<boolean> => {
    try {
      await create(password)
      const result = await initialize(password)
      if (result.hasContainer === false || result.accessKey === undefined) {
        return false
      }

      const raw = result.content ?? ""
      await createContainerState(result.accessKey)
      setContainerStatusToDispatch(dispatch, true)
      setAccessKeyToDispatch(dispatch, result.accessKey)
      setSessionDataToDispatch(dispatch, raw)
      return true
    } catch (_error) {
      return false
    }
  }

  const signIn = async (password: string): Promise<boolean> => {
    try {
      const result = await initialize(password)
      if (result.hasContainer === false || result.accessKey === undefined) {
        return false
      }

      const raw = result.content ?? ""
      await signInState(raw, result.accessKey)
      setContainerStatusToDispatch(dispatch, true)
      setAccessKeyToDispatch(dispatch, result.accessKey)
      setSessionDataToDispatch(dispatch, raw)
      return true
    } catch (_error) {
      return false
    }
  }

  const writeData = async (data: ContainerData): Promise<boolean> => {
    const accessKey = state.accessKey
    if (accessKey === undefined) {
      return false
    }

    try {
      const raw = encodeSessionData(data)
      await set(accessKey, raw)
      await writeStateData(raw, accessKey)
      setContainerStatusToDispatch(dispatch, true)
      setAccessKeyToDispatch(dispatch, accessKey)
      setSessionDataToDispatch(dispatch, raw)
      return true
    } catch (_error) {
      return false
    }
  }

  const clearData = async (): Promise<boolean> => {
    const accessKey = state.accessKey
    if (accessKey === undefined) {
      return false
    }
    try {
      await set(accessKey, "")
      await writeStateData("", accessKey)
      clearSessionDataToDispatch(dispatch)
      return true
    } catch (_error) {
      return false
    }
  }

  const signOut = async (): Promise<void> => {
    deinitialize()
    await signOutState()
    clearSessionDataToDispatch(dispatch)
  }

  return {
    state,
    createContainer,
    signIn,
    writeData,
    clearData,
    signOut
  }
}

export const ExtensionStateProvider = ({ children }: Props) => {
  const value = useExtensionStateStore()

  return (
    <ExtensionStateContext.Provider value={ value }>
      { children }
    </ExtensionStateContext.Provider>
  )
}
