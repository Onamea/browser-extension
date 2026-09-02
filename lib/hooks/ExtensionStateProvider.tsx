import { type ReactNode, useEffect, useReducer, createContext } from "react"
import type { KeyPair } from "@onamea/types"
import type { Message, Operation } from "@onamea/crdt"
import { signOperation } from "@onamea/crdt"
import type { ContainerData, ContainerDataEntry } from "@/lib/types/ContainerData.ts"
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
  appendMessageState,
  initializeState,
  onStateUpdated,
  signInState,
  signOutState,
  syncLocalStateFromStorage,
  writeStateData
} from "@/lib/messaging/client/stateClient.ts"
import { clearMessages, removeMessage } from "../storage/identityMessagesStorage.ts"
import { isRootOperationMessage } from "../storage/isRootOperationMessage.ts"

export type ExtensionStateContextValue = {
  state: ExtensionState
  createContainer: (password: string) => Promise<boolean>
  signIn: (password: string) => Promise<boolean>
  writeIdentity: (identity: ContainerDataEntry) => Promise<boolean>
  writeSubKey: (subKey: ContainerDataEntry) => Promise<boolean>
  clearData: () => Promise<boolean>
  deleteMessage: (message: Message) => Promise<boolean>
  signAndAppendOperation: (operation: Operation, keyPair: KeyPair, shouldAppend?: boolean) => Promise<Message>
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

  const writeContainerData = async (data: ContainerData): Promise<boolean> => {
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

      return true
    } catch (_error) {
      return false
    }
  }

  const writeIdentity = async (identity: ContainerDataEntry): Promise<boolean> => {
    const isSuccess = await writeContainerData({
      identity,
      subKeys: state.container.data?.subKeys ?? []
    })
    return isSuccess
  }

  const writeSubKey = async (subKey: ContainerDataEntry): Promise<boolean> => {
    const data = state.container.data
    if (data === undefined) {
      return false
    }

    const isSuccess = await writeContainerData({
      identity: data.identity,
      subKeys: [...data.subKeys, subKey]
    })
    return isSuccess
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

  const signAndAppendOperation = async (operation: Operation, keyPair: KeyPair, shouldAppend = true): Promise<Message> => {
    try {
      const message = await signOperation(operation, keyPair, Date.now())
      if (shouldAppend) {
        const isSuccess = await appendMessageState(message)
        if (isSuccess === false) {
          throw new Error("Failed to append message to state")
        }
        await syncLocalStateFromStorage()
      }
      return message
    } catch (error) {
      throw error
    }
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
    writeIdentity,
    writeSubKey,
    clearData,
    deleteMessage,
    signAndAppendOperation,
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
