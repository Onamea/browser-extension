import type { AccessKey } from "@/lib/container/main.ts"
import type { ExtensionState } from "@/lib/background/state.ts"
import type { Message } from "@onamea/crdt"
import { getLocalStateFromMessages } from "@/lib/storage/identityMessagesStorage.ts"
import {
  STATE_APPEND_MESSAGE,
  STATE_CREATE_CONTAINER,
  STATE_INIT,
  STATE_SIGNIN,
  STATE_SIGNOUT,
  STATE_SYNC_LOCAL,
  STATE_WRITE_DATA,
  isStateInitializeResponse,
  isStateUpdatedMessage
} from "@/lib/messaging/state.ts"
import { sendRuntimeMessage, subscribeRuntimeMessages } from "@/lib/messaging/client/runtime.ts"

export const initializeState = async (): Promise<ExtensionState | undefined> => {
  const response = await sendRuntimeMessage({ type: STATE_INIT })
  if (isStateInitializeResponse(response) === false) {
    return undefined
  }

  return response.state
}

export const onStateUpdated = (listener: (state: ExtensionState) => void) => {
  return subscribeRuntimeMessages(message => {
    if (isStateUpdatedMessage(message)) {
      listener(message.state)
    }
  })
}

export const createContainerState = async (accessKey: AccessKey): Promise<void> => {
  await sendRuntimeMessage({ type: STATE_CREATE_CONTAINER, accessKey })
}

export const signInState = async (raw: string, accessKey: AccessKey): Promise<void> => {
  await sendRuntimeMessage({ type: STATE_SIGNIN, raw, accessKey })
}

export const writeStateData = async (raw: string, accessKey: AccessKey): Promise<void> => {
  await sendRuntimeMessage({ type: STATE_WRITE_DATA, raw, accessKey })
}

export const syncLocalState = async (local: ExtensionState["local"]): Promise<void> => {
  await sendRuntimeMessage({ type: STATE_SYNC_LOCAL, local })
}

export const syncLocalStateFromStorage = async (): Promise<void> => {
  const localState = await getLocalStateFromMessages()
  await syncLocalState(localState)
}

export const signOutState = async (): Promise<void> => {
  await sendRuntimeMessage({ type: STATE_SIGNOUT })
}

export const appendMessageState = async (message: Message): Promise<boolean> => {
  const response = await sendRuntimeMessage<{ ok?: boolean }>({ type: STATE_APPEND_MESSAGE, message })
  return response.ok === true
}
