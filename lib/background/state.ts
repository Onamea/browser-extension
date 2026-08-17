import { type ContainerData, decodeSessionData } from "../types/ContainerData.ts"
import type { AccessKey } from "@/lib/container/main.ts"

export type ExtensionState = {
  isInitialized: boolean
  hasContainer: boolean
  isUnlocked: boolean
  accessKey: AccessKey | undefined
  raw: string | undefined
  data: ContainerData | undefined
}

export type ExtensionAction =
  | { type: "SET_CONTAINER_STATUS", payload: boolean }
  | { type: "SET_ACCESS_KEY", payload: AccessKey }
  | { type: "SET_SESSION_DATA", payload: string }
  | { type: "CLEAR_SESSION_DATA" }
  | { type: "SIGN_OUT" }

export const initialState: ExtensionState = {
  isInitialized: false,
  hasContainer: false,
  isUnlocked: false,
  accessKey: undefined,
  data: undefined,
  raw: undefined
}

export const extensionReducer = (
  state: ExtensionState = initialState,
  action: ExtensionAction
): ExtensionState => {
  switch (action.type) {
    case "SET_CONTAINER_STATUS": {
      return action.payload === false
        ? {
            isInitialized: true,
            hasContainer: false,
            isUnlocked: false,
            accessKey: undefined,
            raw: undefined,
            data: undefined
          }
        : {
            ...state,
            isInitialized: true,
            hasContainer: true
          }
    }
    case "SET_ACCESS_KEY":
      return {
        ...state,
        isInitialized: true,
        hasContainer: true,
        accessKey: action.payload,
        isUnlocked: true
      }
    case "SET_SESSION_DATA": {
      const raw = action.payload
      const data = decodeSessionData(raw)
      return {
        ...state,
        isInitialized: true,
        hasContainer: true,
        raw,
        data
      }
    }
    case "CLEAR_SESSION_DATA":
      return {
        ...state,
        isInitialized: true,
        hasContainer: true,
        raw: "",
        data: undefined
      }
    case "SIGN_OUT":
      return {
        isInitialized: true,
        hasContainer: true,
        isUnlocked: false,
        accessKey: undefined,
        raw: undefined,
        data: undefined
      }
    default:
      return state
  }
}

export const setContainerStatus = (dispatch: (action: ExtensionAction) => void, containerExists: boolean) => {
  dispatch({ type: "SET_CONTAINER_STATUS", payload: containerExists })
}

export const setAccessKey = (dispatch: (action: ExtensionAction) => void, accessKey: AccessKey) => {
  dispatch({ type: "SET_ACCESS_KEY", payload: accessKey })
}

export const setSessionData = (dispatch: (action: ExtensionAction) => void, raw: string) => {
  dispatch({ type: "SET_SESSION_DATA", payload: raw })
}

export const clearSessionData = (dispatch: (action: ExtensionAction) => void) => {
  dispatch({ type: "CLEAR_SESSION_DATA" })
}

export const signOut = (dispatch: (action: ExtensionAction) => void) => {
  dispatch({ type: "SIGN_OUT" })
}

export let backgroundState = initialState

export const backgroundDispatch = (action: ExtensionAction) => {
  backgroundState = extensionReducer(backgroundState, action)
}
