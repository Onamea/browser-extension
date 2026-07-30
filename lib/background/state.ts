import { type ContainerData, decodeSessionData } from "../container.ts"
import type { AccessKey } from "@/lib/container/main.ts"

export type ExtensionState = {
  containerExists: boolean | undefined
  accessKey: AccessKey | undefined
  raw: string | undefined
  data: ContainerData | undefined
}

export type ExtensionAction =
  | { type: "SET_CONTAINER_EXISTS", payload: boolean | undefined }
  | { type: "SET_ACCESS_KEY", payload: AccessKey | undefined }
  | { type: "SET_DATA", payload: string | undefined }
  | { type: "CLEAR_DATA" }

export const initialState: ExtensionState = {
  containerExists: undefined,
  accessKey: undefined,
  data: undefined,
  raw: undefined
}

export const extensionReducer = (
  state: ExtensionState = initialState,
  action: ExtensionAction
): ExtensionState => {
  switch (action.type) {
    case "SET_CONTAINER_EXISTS":
      return { ...state, containerExists: action.payload }
    case "SET_ACCESS_KEY":
      return { ...state, accessKey: action.payload }
    case "SET_DATA": {
      if (action.payload === undefined) {
        return { ...state, raw: undefined, data: undefined }
      }
      const raw = action.payload
      const data = decodeSessionData(raw)
      return { ...state, raw, data }
    }
    case "CLEAR_DATA":
      return {
        ...state,
        accessKey: undefined,
        raw: undefined,
        data: undefined
      }
    default:
      return state
  }
}

export const setContainerExists = (dispatch: (action: ExtensionAction) => void, containerExists: boolean | undefined) => {
  dispatch({ type: "SET_CONTAINER_EXISTS", payload: containerExists })
}

export const setAccessKey = (dispatch: (action: ExtensionAction) => void, accessKey: AccessKey | undefined) => {
  dispatch({ type: "SET_ACCESS_KEY", payload: accessKey })
}

export const setData = (dispatch: (action: ExtensionAction) => void, raw: string) => {
  dispatch({ type: "SET_DATA", payload: raw })
}

export const clearData = (dispatch: (action: ExtensionAction) => void) => {
  dispatch({ type: "CLEAR_DATA" })
}

export let backgroundState = initialState

export const backgroundDispatch = (action: ExtensionAction) => {
  backgroundState = extensionReducer(backgroundState, action)
}
