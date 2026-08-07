import { useEffect, useReducer, type ReactNode, createContext } from "react"
import type { ContainerData } from "@/lib/background/ContainerData.ts"
import { encodeSessionData } from "@/lib/background/ContainerData.ts"
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
import isObject from "@/lib/utils/isObject.ts"

export type ExtensionStateContextValue = {
  state: ExtensionState
  createContainer: (password: string) => Promise<boolean>
  signIn: (password: string) => Promise<boolean>
  writeData: (data: ContainerData) => Promise<boolean>
  clearData: () => Promise<boolean>
  signOut: () => Promise<void>
}

export const ExtensionStateContext = createContext<ExtensionStateContextValue | undefined>(undefined)

type StateUpdatedMessage = {
  type: "STATE_UPDATED"
  state: ExtensionState
}

type InitializeResponse = {
  state: ExtensionState
}

type Props = {
  children: ReactNode
}

const isStateUpdatedMessage = (message: unknown): message is StateUpdatedMessage => {
  if (isObject(message) === false) return false
  const candidate = message as { type?: unknown, state?: unknown }
  return candidate.type === "STATE_UPDATED" && isObject(candidate.state)
}

const isInitializeResponse = (response: unknown): response is InitializeResponse => {
  if (isObject(response) === false) return false
  const candidate = response as { state?: unknown }
  return isObject(candidate.state)
}

const useExtensionStateStore = () => {
  const [state, dispatch] = useReducer(extensionReducer, initialState)

  useEffect(() => {
    const syncState = (nextState: ExtensionState) => {
      setContainerExistsToDispatch(dispatch, nextState.hasContainer)
      setAccessKeyToDispatch(dispatch, nextState.accessKey)
      setDataToDispatch(dispatch, nextState.raw)
    }

    browser.runtime.sendMessage({ type: "INITIALIZE" }).then((response: unknown) => {
      if (isInitializeResponse(response)) {
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
      await browser.runtime.sendMessage({ type: "CREATE_CONTAINER", accessKey: result.accessKey })
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
      await browser.runtime.sendMessage({ type: "SIGNIN", raw, accessKey: result.accessKey })
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
      await browser.runtime.sendMessage({ type: "WRITE_DATA", raw, accessKey })
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
      await browser.runtime.sendMessage({ type: "WRITE_DATA", raw: "", accessKey })
      clearDataToDispatch(dispatch)
      setContainerExistsToDispatch(dispatch, true)
      return true
    } catch (_error) {
      return false
    }
  }

  const signOut = async (): Promise<void> => {
    deinitialize()
    await browser.runtime.sendMessage({ type: "SIGNOUT" })
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
