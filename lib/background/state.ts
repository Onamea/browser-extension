import type { FingerprintedName } from "@onamea/types"
import type { IdentityWithMessages, Messages } from "@onamea/crdt"
import { type ContainerData, decodeSessionData } from "../types/ContainerData.ts"
import type { AccessKey } from "@/lib/container/main.ts"

type ExtendedSubKey = IdentityWithMessages["subKeys"][number] & { fingerprintedName: FingerprintedName }
export type ExtendedIdentityWithMessages = Omit<IdentityWithMessages, "subKeys"> & { subKeys: ExtendedSubKey[] }

export type ExtensionState = {
  isInitialized: boolean
  isInSync: boolean
  container: {
    hasContainer: boolean
    isUnlocked: boolean
    accessKey: AccessKey | undefined
    raw: string | undefined
    data: ContainerData | undefined
  }
  local: {
    messages: Messages
    identity: ExtendedIdentityWithMessages | undefined
  }
}

export type ExtensionAction =
  | { type: "REPLACE_STATE", payload: ExtensionState }
  | { type: "SET_CONTAINER_STATUS", payload: boolean }
  | { type: "SET_ACCESS_KEY", payload: AccessKey }
  | { type: "SET_SESSION_DATA", payload: string }
  | { type: "CLEAR_SESSION_DATA" }
  | { type: "SET_LOCAL_STATE", payload: ExtensionState["local"] }
  | { type: "SET_SYNC_STATUS", payload: boolean }
  | { type: "SIGN_OUT" }

export const initialState: ExtensionState = {
  isInitialized: false,
  isInSync: true,
  container: {
    hasContainer: false,
    isUnlocked: false,
    accessKey: undefined,
    data: undefined,
    raw: undefined
  }, 
  local: {
    messages: [],
    identity: undefined
  }
}

export const extensionReducer = (
  state: ExtensionState = initialState,
  action: ExtensionAction
): ExtensionState => {
  switch (action.type) {
    case "REPLACE_STATE": {
      // container.data crosses the extension messaging boundary as plain objects
      // (Uint8Array fields lose their prototype), so rebuild it from the raw string instead
      const { raw } = action.payload.container
      return {
        ...action.payload,
        container: {
          ...action.payload.container,
          data: raw === undefined ? undefined : decodeSessionData(raw)
        }
      }
    }
    case "SET_CONTAINER_STATUS":
      return action.payload === false
        ? {
            ...state,
            isInitialized: true,
            container: {
              hasContainer: false,
              isUnlocked: false,
              accessKey: undefined,
              raw: undefined,
              data: undefined
            }
          }
        : {
            ...state,
            isInitialized: true,
            container: {
              ...state.container,
              hasContainer: true
            }
          }
    case "SET_ACCESS_KEY":
      return {
        ...state,
        isInitialized: true,
        container: {
          ...state.container,
          hasContainer: true,
          accessKey: action.payload,
          isUnlocked: true
        }
      }
    case "SET_SESSION_DATA": {
      const raw = action.payload
      const data = decodeSessionData(raw)
      return {
        ...state,
        isInitialized: true,
        container: {
          ...state.container,
          hasContainer: true,
          raw,
          data
        }
      }
    }
    case "CLEAR_SESSION_DATA":
      return {
        ...state,
        isInitialized: true,
        container: {
          ...state.container,
          hasContainer: true,
          raw: "",
          data: undefined
        }
      }
    case "SET_LOCAL_STATE":
      return {
        ...state,
        isInitialized: true,
        local: action.payload
      }
    case "SET_SYNC_STATUS":
      return {
        ...state,
        isInSync: action.payload
      }
    case "SIGN_OUT":
      return {
        ...state,
        isInitialized: true,
        isInSync: true,
        container: {
          hasContainer: true,
          isUnlocked: false,
          accessKey: undefined,
          raw: undefined,
          data: undefined
        }
      }
    default:
      return state
  }
}

export const replaceState = (dispatch: (action: ExtensionAction) => void, state: ExtensionState) => {
  dispatch({ type: "REPLACE_STATE", payload: state })
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

export const setLocalState = (dispatch: (action: ExtensionAction) => void, local: ExtensionState["local"]) => {
  dispatch({ type: "SET_LOCAL_STATE", payload: local })
}

export const setSyncStatus = (dispatch: (action: ExtensionAction) => void, isInSync: boolean) => {
  dispatch({ type: "SET_SYNC_STATUS", payload: isInSync })
}

export const signOut = (dispatch: (action: ExtensionAction) => void) => {
  dispatch({ type: "SIGN_OUT" })
}

export let backgroundState = initialState

export const backgroundDispatch = (action: ExtensionAction) => {
  backgroundState = extensionReducer(backgroundState, action)
}
