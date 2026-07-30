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
import { type AccessKey } from "@/lib/container/main.ts"

type StateUpdatedMessage = {
  type: "STATE_UPDATED"
  state: ExtensionState
}

type GetStateResponse = {
  state?: ExtensionState
}

const isStateUpdatedMessage = (message: unknown): message is StateUpdatedMessage => {
  if (isObject(message) === false) return false
  const candidate = message as { type?: unknown, state?: unknown }
  return candidate.type === "STATE_UPDATED" && isObject(candidate.state)
}

const isGetStateResponse = (response: unknown): response is GetStateResponse => {
  if (isObject(response) === false) return false
  const candidate = response as { state?: unknown }
  return candidate.state === undefined || isObject(candidate.state)
}

const useExtensionState = () => {
  const [state, dispatch] = useReducer(extensionReducer, initialState)

  const syncState = (nextState: ExtensionState) => {
    dispatch({ type: "SET_CONTAINER_EXISTS", payload: nextState.containerExists })
    dispatch({ type: "SET_ACCESS_KEY", payload: nextState.accessKey })
    dispatch({ type: "SET_DATA", payload: nextState.raw })
  }

  // Fetch initial state from background on mount
  useEffect(() => {
    browser.runtime.sendMessage({ type: "GET_STATE" }).then((response: unknown) => {
      if (isGetStateResponse(response) && response.state) {
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

  const setContainerExists = async (value: boolean | undefined) => {
    await browser.runtime.sendMessage({ type: "SET_CONTAINER_EXISTS", value })
    setContainerExistsToDispatch(dispatch, value)
  }

  const setAccessKey = async (accessKey: AccessKey | undefined) => {
    await browser.runtime.sendMessage({ type: "SET_ACCESS_KEY", accessKey })
    setAccessKeyToDispatch(dispatch, accessKey)
  }

  const setData = async (data: string, accessKey?: string) => {
    await browser.runtime.sendMessage({ type: "SET_DATA", data, accessKey })
    setContainerExistsToDispatch(dispatch, true)
    setDataToDispatch(dispatch, data)
    if (accessKey !== undefined) {
      setAccessKeyToDispatch(dispatch, accessKey)
    }
  }

  const clearData = async () => {
    await browser.runtime.sendMessage({ type: "CLEAR_DATA" })
    clearDataToDispatch(dispatch)
  }

  return {
    state,
    setContainerExists,
    setAccessKey,
    setData,
    clearData
  }
}

export default useExtensionState
