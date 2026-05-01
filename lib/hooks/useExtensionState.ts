import { useReducer, useEffect } from "react"
import {
  extensionReducer,
  initialState,
  clearSlot as clearSlotToDispatch,
  setContainerExists as setContainerExistsToDispatch,
  setSlot as setSlotToDispatch
} from "../background/state.ts"

import type { ExtensionState } from "../background/state.ts"
import type { SlotData } from "../pdec.ts"

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
    if (nextState.slot !== undefined) {
      dispatch({ type: "SET_SLOT", payload: nextState.slot.slot })
      return
    }
    dispatch({ type: "CLEAR_SLOT" })
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

  const setContainerExists = (value: boolean | undefined) => setContainerExistsToDispatch(dispatch, value)
  const setSlot = (slot: SlotData) => setSlotToDispatch(dispatch, slot)
  const clearSlot = () => clearSlotToDispatch(dispatch)

  return {
    state,
    clearSlot,
    setContainerExists,
    setSlot
  }
}

export default useExtensionState
