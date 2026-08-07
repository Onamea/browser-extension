import type { ExtensionState } from "@/lib/background/state.ts"
import type { AccessKey } from "@/lib/container/main.ts"
import isObject from "@/lib/utils/isObject.ts"

export const STATE_INIT = "STATE:INIT"
export const STATE_CREATE_CONTAINER = "STATE:CREATE_CONTAINER"
export const STATE_SIGNIN = "STATE:SIGNIN"
export const STATE_WRITE_DATA = "STATE:WRITE_DATA"
export const STATE_SIGNOUT = "STATE:SIGNOUT"
export const STATE_UPDATED = "STATE:UPDATED"

export type StateInitMessage = {
  type: typeof STATE_INIT
}

export type StateCreateContainerMessage = {
  type: typeof STATE_CREATE_CONTAINER
  accessKey: AccessKey
}

export type StateSigninMessage = {
  type: typeof STATE_SIGNIN
  raw: string
  accessKey: AccessKey
}

export type StateWriteDataMessage = {
  type: typeof STATE_WRITE_DATA
  raw: string
  accessKey: AccessKey
}

export type StateSignoutMessage = {
  type: typeof STATE_SIGNOUT
}

export type StateUpdatedMessage = {
  type: typeof STATE_UPDATED
  state: ExtensionState
}

export type StateInitializeResponse = {
  state: ExtensionState
}

export type StateMessage =
  | StateInitMessage
  | StateCreateContainerMessage
  | StateSigninMessage
  | StateWriteDataMessage
  | StateSignoutMessage
  | StateUpdatedMessage

export const isStateUpdatedMessage = (message: unknown): message is StateUpdatedMessage => {
  if (isObject(message) === false) {
    return false
  }

  const candidate = message as { type?: unknown, state?: unknown }
  return candidate.type === STATE_UPDATED && isObject(candidate.state)
}

export const isStateInitializeResponse = (response: unknown): response is StateInitializeResponse => {
  if (isObject(response) === false) {
    return false
  }

  const candidate = response as { state?: unknown }
  return isObject(candidate.state)
}
