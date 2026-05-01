import type { NameKey, FingerprintedName, KeyPairDisplay } from "@vanice/types"
import { type SlotData, decodeSlotData } from "../pdec.ts"

export type SlotDataState = {
  nameKey: NameKey
  fingerprintedName: FingerprintedName
  keyPair: KeyPairDisplay
}

export type SlotState = {
  slot: SlotData
  slotData: SlotDataState | undefined
}

export type ExtensionState = {
  containerExists: boolean | undefined
  slot: SlotState | undefined
}

export type ExtensionAction =
  | { type: "SET_CONTAINER_EXISTS", payload: boolean | undefined }
  | { type: "SET_SLOT", payload: SlotData }
  | { type: "CLEAR_SLOT" }

export const initialState: ExtensionState = {
  containerExists: undefined,
  slot: undefined
}

export const extensionReducer = (
  state: ExtensionState = initialState,
  action: ExtensionAction
): ExtensionState => {
  switch (action.type) {
    case "SET_CONTAINER_EXISTS":
      return { ...state, containerExists: action.payload }
    case "SET_SLOT": {
      const slotData = decodeSlotData(action.payload)
      return { ...state, slot: { slot: action.payload, slotData } }
    }
    case "CLEAR_SLOT":
      return { ...state, slot: undefined }
    default:
      return state
  }
}

export const setContainerExists = (dispatch: (action: ExtensionAction) => void, value: boolean | undefined) => {
  dispatch({ type: "SET_CONTAINER_EXISTS", payload: value })
}

export const setSlot = (dispatch: (action: ExtensionAction) => void, slot: SlotData) => {
  dispatch({ type: "SET_SLOT", payload: slot })
}

export const clearSlot = (dispatch: (action: ExtensionAction) => void) => {
  dispatch({ type: "CLEAR_SLOT" })
}

export let backgroundState = initialState

export const backgroundDispatch = (action: ExtensionAction) => {
  backgroundState = extensionReducer(backgroundState, action)
}
