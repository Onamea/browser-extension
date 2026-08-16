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
  | { type: "INITIALIZE", payload: boolean }
  | { type: "SIGNIN", payload: AccessKey | undefined }
  | { type: "WRITE_DATA", payload: string | undefined }
  | { type: "CLEAR_DATA" }
  | { type: "SIGNOUT" }

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
    case "INITIALIZE": {
      return action.payload === false
        ? {
            ...state,
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
    case "SIGNIN":
      if (action.payload === undefined) {
        return {
          ...state,
          accessKey: undefined,
          isUnlocked: false,
          raw: undefined,
          data: undefined
        }
      }

      return {
        ...state,
        isInitialized: true,
        hasContainer: true,
        accessKey: action.payload,
        isUnlocked: true
      }
    case "WRITE_DATA": {
      if (action.payload === undefined) {
        return { ...state, raw: undefined, data: undefined }
      }
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
    case "CLEAR_DATA":
      return {
        ...state,
        isInitialized: true,
        hasContainer: true,
        raw: "",
        data: undefined
      }
    case "SIGNOUT":
      return {
        ...state,
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

export const setContainerExists = (dispatch: (action: ExtensionAction) => void, containerExists: boolean) => {
  dispatch({ type: "INITIALIZE", payload: containerExists })
}

export const setAccessKey = (dispatch: (action: ExtensionAction) => void, accessKey: AccessKey | undefined) => {
  dispatch({ type: "SIGNIN", payload: accessKey })
}

export const setData = (dispatch: (action: ExtensionAction) => void, raw: string | undefined) => {
  dispatch({ type: "WRITE_DATA", payload: raw })
}

export const clearData = (dispatch: (action: ExtensionAction) => void) => {
  dispatch({ type: "CLEAR_DATA" })
}

export const clearSession = (dispatch: (action: ExtensionAction) => void) => {
  dispatch({ type: "SIGNOUT" })
}

export let backgroundState = initialState

export const backgroundDispatch = (action: ExtensionAction) => {
  backgroundState = extensionReducer(backgroundState, action)
}
