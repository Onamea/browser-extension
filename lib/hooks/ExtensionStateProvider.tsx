import { useEffect, useReducer, type ReactNode, createContext } from "react"
import type { ContainerData } from "@/lib/types/ContainerData.ts"
import { encodeSessionData } from "@/lib/types/ContainerData.ts"
import {
  extensionReducer,
  initialState,
  clearData as clearDataToDispatch,
  setContainerExists as setContainerExistsToDispatch,
  setData as setDataToDispatch,
  setAccessKey as setAccessKeyToDispatch
} from "../background/state.ts"
import type { ExtensionState } from "../background/state.ts"
import { create, deinitialize, initialize as initializeSession, set as setSessionData } from "@/lib/container/main.ts"
import {
  STATE_CREATE_CONTAINER,
  STATE_INIT,
  STATE_SIGNIN,
  STATE_SIGNOUT,
  STATE_WRITE_DATA,
  isStateInitializeResponse,
  isStateUpdatedMessage
} from "@/lib/messaging/state.ts"

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
      setContainerExistsToDispatch(dispatch, nextState.hasContainer)
      setAccessKeyToDispatch(dispatch, nextState.accessKey)
      setDataToDispatch(dispatch, nextState.raw)
    }

    browser.runtime.sendMessage({ type: STATE_INIT }).then((response: unknown) => {
      if (isStateInitializeResponse(response)) {
        syncState(response.state)
      }
    }).catch((error) => {
      console.error("Failed to initialize extension state:", error)
    })

    const listener = (message: unknown) => {
      if (isStateUpdatedMessage(message)) {
        syncState(message.state)
      }
    }
    browser.runtime.onMessage.addListener(listener)
    return () => {
      browser.runtime.onMessage.removeListener(listener)
    }
  }, [])

  const createContainer = async (password: string): Promise<boolean> => {
    try {
      await create(password)
      const result = await initializeSession(password)
      if (result.hasContainer === false || result.accessKey === undefined) {
        return false
      }

      const raw = result.content ?? ""
      await browser.runtime.sendMessage({ type: STATE_CREATE_CONTAINER, accessKey: result.accessKey })
      setContainerExistsToDispatch(dispatch, true)
      setAccessKeyToDispatch(dispatch, result.accessKey)
      setDataToDispatch(dispatch, raw)
      return true
    } catch (_error) {
      return false
    }
  }

  const signIn = async (password: string): Promise<boolean> => {
    try {
      const result = await initializeSession(password)
      if (result.hasContainer === false || result.accessKey === undefined) {
        return false
      }

      const raw = result.content ?? ""
      await browser.runtime.sendMessage({ type: STATE_SIGNIN, raw, accessKey: result.accessKey })
      setContainerExistsToDispatch(dispatch, true)
      setAccessKeyToDispatch(dispatch, result.accessKey)
      setDataToDispatch(dispatch, raw)
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
      await setSessionData(accessKey, raw)
      await browser.runtime.sendMessage({ type: STATE_WRITE_DATA, raw, accessKey })
      setContainerExistsToDispatch(dispatch, true)
      setAccessKeyToDispatch(dispatch, accessKey)
      setDataToDispatch(dispatch, raw)
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
      await setSessionData(accessKey, "")
      await browser.runtime.sendMessage({ type: STATE_WRITE_DATA, raw: "", accessKey })
      clearDataToDispatch(dispatch)
      setContainerExistsToDispatch(dispatch, true)
      return true
    } catch (_error) {
      return false
    }
  }

  const signOut = async (): Promise<void> => {
    deinitialize()
    await browser.runtime.sendMessage({ type: STATE_SIGNOUT })
    clearDataToDispatch(dispatch)
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
