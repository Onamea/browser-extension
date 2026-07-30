import { useReducer, useEffect } from "react"
import type { ExtensionState } from "../background/state.ts"
import {
  extensionReducer,
  initialState,
  clearData as clearDataToDispatch,
  setContainerExists as setContainerExistsToDispatch,
  setData as setDataToDispatch,
  setAccessKey as setAccessKeyToDispatch
} from "../background/state.ts"
import isObject from "@/lib/utils/isObject.ts"
import { create, initialize as initializeSession, deinitialize, set as setSessionData } from "@/lib/container/main.ts"
import type { ContainerData } from "@/lib/background/ContainerData.ts"
import { encodeSessionData } from "@/lib/background/ContainerData.ts"

type StateUpdatedMessage = {
  type: "STATE_UPDATED"
  state: ExtensionState
}

type InitializeResponse = {
  state: ExtensionState
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

const useExtensionState = () => {
  const [state, dispatch] = useReducer(extensionReducer, initialState)

  const syncState = (nextState: ExtensionState) => {
    setContainerExistsToDispatch(dispatch, nextState.hasContainer)
    setAccessKeyToDispatch(dispatch, nextState.accessKey)
    setDataToDispatch(dispatch, nextState.raw)
  }

  // Hydrate state from background on mount
  useEffect(() => {
    browser.runtime.sendMessage({ type: "INITIALIZE" }).then((response: unknown) => {
      if (isInitializeResponse(response)) {
        syncState(response.state)
      }
    })

    // Listen for background state updates
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

  const initialize = async (): Promise<void> => {
    const response = await browser.runtime.sendMessage({ type: "INITIALIZE" }) as InitializeResponse
    if (isInitializeResponse(response)) {
      syncState(response.state)
    }
  }

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

  const signOut = async (): Promise<void> => {
    deinitialize()
    await browser.runtime.sendMessage({ type: "SIGNOUT" })
    clearDataToDispatch(dispatch)
    setContainerExistsToDispatch(dispatch, true)
  }

  return {
    state,
    initialize,
    createContainer,
    signIn,
    writeData,
    signOut
  }
}

export default useExtensionState
