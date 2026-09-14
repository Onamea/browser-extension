import { type ReactNode, useEffect, useReducer, createContext } from "react"
import type { NameKey } from "@onamea/types"
import { createAndAttachOperation, signOperation } from "@onamea/crdt"
import type { IdentityWithMessages, Message, Operation, OperationType } from "@onamea/crdt"
import type { ContainerData, ContainerDataEntry } from "@/lib/types/ContainerData.ts"
import { appendContainerDataEntry, encodeSessionData, findEntryInContainerData } from "@/lib/types/ContainerData.ts"
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
import useLatest from "./useLatest.ts"

export type ExtensionStateContextValue = {
  state: ExtensionState
  createContainer: (password: string) => Promise<boolean>
  signIn: (password: string) => Promise<boolean>
  writeEntry: (entry: ContainerDataEntry) => Promise<boolean>
  clearData: () => Promise<boolean>
  deleteMessage: (message: Message) => Promise<boolean>
  createSignAndAppendOperation: (identity: IdentityWithMessages, operationType: OperationType, value?: string, value2?: string) => Promise<Message | undefined>
  signAndAppendOperation: (operation: Operation, nameKey: NameKey, shouldAppend?: boolean) => Promise<Message>
  signOut: () => Promise<void>
}

export const ExtensionStateContext = createContext<ExtensionStateContextValue | undefined>(undefined)

type Props = {
  children: ReactNode
}

export const createSignAndAppendOperation = async (
  identity: IdentityWithMessages,
  operationType: OperationType,
  value: string | undefined,
  value2: string | undefined,
  signAndAppendOperation: (operation: Operation, nameKey: NameKey, shouldAppend?: boolean) => Promise<Message>
): Promise<Message | undefined> => {
  try {
    const operation = await createAndAttachOperation(identity.operations, operationType, value, value2)
    return await signAndAppendOperation(operation, identity.id)
  } catch (error) {
    console.error("Failed to create, sign, and append operation:", error)
    return undefined
  }
}

const useExtensionStateStore = () => {
  const [state, dispatch] = useReducer(extensionReducer, initialState)
  const containerData = useLatest(state.container.data)

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

  // dispatch is async, so callers should use the returned data instead of state.container.data
  const writeContainerData = async (data: ContainerData): Promise<ContainerData | undefined> => {
    const accessKey = state.container.accessKey
    if (accessKey === undefined) {
      return undefined
    }

    let raw: string
    try {
      raw = encodeSessionData(data)
      await set(accessKey, raw)
    } catch (_error) {
      return undefined
    }

    containerData.current = data
    setContainerStatusToDispatch(dispatch, true)
    setAccessKeyToDispatch(dispatch, accessKey)
    setSessionDataToDispatch(dispatch, raw)

    // best-effort broadcast; storage write above already succeeded
    await writeStateData(raw, accessKey).catch(error => {
      console.error("Failed to notify background of container data update:", error)
    })

    return data
  }

  const writeEntry = async (entry: ContainerDataEntry): Promise<boolean> => {
    const latestData = containerData.current ?? []
    try {
      const nextData = appendContainerDataEntry(latestData, entry)
      return await writeContainerData(nextData) !== undefined
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

  const signAndAppendOperation = async (operation: Operation, nameKey: NameKey, shouldAppend = true): Promise<Message> => {
    try {
      const keyPair = containerData.current !== undefined
        ? findEntryInContainerData(containerData.current, nameKey)?.keyPair
        : undefined
      if (keyPair === undefined) {
        throw new Error(`Key pair for (${ nameKey }) not found in ContainerData`)
      }
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
    writeEntry,
    clearData,
    deleteMessage,
    createSignAndAppendOperation: (
      identity: IdentityWithMessages,
      operationType: OperationType,
      value?: string,
      value2?: string
    ) =>
      createSignAndAppendOperation(identity, operationType, value, value2, signAndAppendOperation),
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
