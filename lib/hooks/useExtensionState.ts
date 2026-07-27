import { useReducer, useEffect } from "react"
import {
  extensionReducer,
  initialState,
  clearData as clearDataToDispatch,
  setContainerExists as setContainerExistsToDispatch,
  setData as setDataToDispatch
} from "../background/state.ts"

import type { ExtensionState } from "../background/state.ts"

type StateUpdatedMessage = {
  type: "STATE_UPDATED"
  state: ExtensionState
}

type GetStateResponse = {
  state?: ExtensionState
}

const isStateUpdatedMessage = (message: unknown): message is StateUpdatedMessage => {
  if (typeof message !== "object" || message === null) return false
  const candidate = message as { type?: unknown, state?: unknown }
  return candidate.type === "STATE_UPDATED" && typeof candidate.state === "object" && candidate.state !== null
}

const isGetStateResponse = (response: unknown): response is GetStateResponse => {
  if (typeof response !== "object" || response === null) return false
  const candidate = response as { state?: unknown }
  return candidate.state === undefined || (typeof candidate.state === "object" && candidate.state !== null)
}

const useExtensionState = () => {
  const [state, dispatch] = useReducer(extensionReducer, initialState)

  const syncState = (nextState: ExtensionState) => {
    dispatch({ type: "SET_CONTAINER_EXISTS", payload: nextState.containerExists })
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

  const setData = async (data: string) => {
    await browser.runtime.sendMessage({ type: "SET_DATA", data })
    setContainerExistsToDispatch(dispatch, true)
    setDataToDispatch(dispatch, data)
  }

  const clearData = async () => {
    await browser.runtime.sendMessage({ type: "CLEAR_DATA" })
    clearDataToDispatch(dispatch)
  }

  return {
    state,
    clearData,
    setContainerExists,
    setData
  }
}

export default useExtensionState
