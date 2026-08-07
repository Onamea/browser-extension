import type { AccessKey } from "@/lib/container/main.ts"
import type { ExtensionState } from "@/lib/background/state.ts"
import {
  STATE_CREATE_CONTAINER,
  STATE_INIT,
  STATE_SIGNIN,
  STATE_SIGNOUT,
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

export const signOutState = async (): Promise<void> => {
  await sendRuntimeMessage({ type: STATE_SIGNOUT })
}
