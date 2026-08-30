import { type ReactNode, useEffect, useReducer, createContext } from "react"
import type { Message, Operation } from "@onamea/crdt"
import { createCreateOperation, signOperation } from "@onamea/crdt"
import type { ContainerData } from "@/lib/types/ContainerData.ts"
import { encodeSessionData } from "@/lib/types/ContainerData.ts"
import {
  extensionReducer,
  initialState,
  replaceState as replaceStateToDispatch,
  clearSessionData as clearSessionDataToDispatch,
  setContainerStatus as setContainerStatusToDispatch,
  setSessionData as setSessionDataToDispatch,
  setAccessKey as setAccessKeyToDispatch
} from "../background/state.ts"
import type { ExtensionState } from "../background/state.ts"
import { create, deinitialize, initialize, set } from "@/lib/container/main.ts"
import {
  createContainerState,
  appendOperationState,
  appendMessageState,
  initializeState,
  onStateUpdated,
  signInState,
  signOutState,
  syncLocalStateFromStorage,
  writeStateData
} from "@/lib/messaging/client/stateClient.ts"
import { clearMessages, removeMessage, writeMessage } from "../storage/identityMessagesStorage.ts"
import { isRootOperationMessage } from "../storage/isRootOperationMessage.ts"

export type ExtensionStateContextValue = {
  state: ExtensionState
  createContainer: (password: string) => Promise<boolean>
  signIn: (password: string) => Promise<boolean>
  writeData: (data: ContainerData) => Promise<boolean>
  clearData: () => Promise<boolean>
  deleteMessage: (message: Message) => Promise<boolean>
  appendOperation: (operation: Operation) => Promise<boolean>
  appendMessage: (message: Message) => Promise<boolean>
  signOut: () => Promise<void>
}

export const ExtensionStateContext = createContext<ExtensionStateContextValue | undefined>(undefined)

type Props = {
  children: ReactNode
}

const useExtensionStateStore = () => {
  const [state, dispatch] = useReducer(extensionReducer, initialState)

  useEffect(() => {
    const syncState = (nextState: ExtensionState) => {
      replaceStateToDispatch(dispatch, nextState)
    }

    initializeState().then(stateResponse => {
      if (stateResponse !== undefined) {
        syncState(stateResponse)
      }
    }).catch((error) => {
      console.error("Failed to initialize extension state:", error)
    })

    return onStateUpdated(syncState)
  }, [])

  const createContainer = async (password: string): Promise<boolean> => {
    try {
      await create(password)
      const result = await initialize(password)
      if (result.hasContainer === false || result.accessKey === undefined) {
        return false
      }

      const raw = result.content ?? ""
      await createContainerState(result.accessKey)
      setContainerStatusToDispatch(dispatch, true)
      setAccessKeyToDispatch(dispatch, result.accessKey)
      setSessionDataToDispatch(dispatch, raw)
      return true
    } catch (_error) {
      return false
    }
  }

  const signIn = async (password: string): Promise<boolean> => {
    try {
      const result = await initialize(password)
      if (result.hasContainer === false || result.accessKey === undefined) {
        return false
      }

      const raw = result.content ?? ""
      await signInState(raw, result.accessKey)
      setContainerStatusToDispatch(dispatch, true)
      setAccessKeyToDispatch(dispatch, result.accessKey)
      setSessionDataToDispatch(dispatch, raw)
      return true
    } catch (_error) {
      return false
    }
  }

  const writeData = async (data: ContainerData): Promise<boolean> => {
    const accessKey = state.container.accessKey
    if (accessKey === undefined) {
      return false
    }

    try {
      const raw = encodeSessionData(data)
      await set(accessKey, raw)
      await writeStateData(raw, accessKey)
      setContainerStatusToDispatch(dispatch, true)
      setAccessKeyToDispatch(dispatch, accessKey)
      setSessionDataToDispatch(dispatch, raw)

      // extension storage
      const { nameKey, keyPair } = data
      const createOperation = await createCreateOperation(nameKey)
      const message = await signOperation(createOperation, keyPair, Date.now())
      await writeMessage(message)
      await syncLocalStateFromStorage()

      return true
    } catch (_error) {
      return false
    }
  }

  const clearData = async (): Promise<boolean> => {
    const accessKey = state.container.accessKey
    if (accessKey === undefined) {
      return false
    }
    try {
      await set(accessKey, "")
      await writeStateData("", accessKey)
      clearSessionDataToDispatch(dispatch)

      // extension storage
      await clearMessages()
      await syncLocalStateFromStorage()

      return true
    } catch (_error) {
      return false
    }
  }

  const deleteMessage = async (message: Message): Promise<boolean> => {
    const identity = state.local.identity
    if (identity === undefined) {
      return false
    }

    try {
      if (await isRootOperationMessage(identity.id, message)) {
        return false
      }

      await removeMessage(message)
      await syncLocalStateFromStorage()
      return true
    } catch (_error) {
      return false
    }
  }

  const appendOperation = async (operation: Operation): Promise<boolean> => {
    return await appendOperationState(operation)
  }

  const appendMessage = async (message: Message): Promise<boolean> => {
    return await appendMessageState(message)
  }

  const signOut = async (): Promise<void> => {
    deinitialize()
    await signOutState()
    clearSessionDataToDispatch(dispatch)
  }

  return {
    state,
    createContainer,
    signIn,
    writeData,
    clearData,
    deleteMessage,
    appendOperation,
    appendMessage,
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
