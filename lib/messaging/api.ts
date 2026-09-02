import type { IdentityWithMessages } from "@onamea/crdt"
import type { PendingRequest, SignRequestResult } from "@/lib/background/signFlow.ts"

export const API_IDENTIFY = "API:IDENTIFY"
export const API_SIGN = "API:SIGN"
export const API_GET_PENDING_REQUEST = "API:GET_PENDING_REQUEST"
export const API_CONFIRM_SIGN = "API:CONFIRM_SIGN"
export const API_REJECT_SIGN = "API:REJECT_SIGN"

export type IdentifyMessage = {
  type: typeof API_IDENTIFY
}

export type SignMessage = {
  type: typeof API_SIGN
  data: unknown
  requestId: string
}

export type IdentifyResponse = IdentityWithMessages

export type SignResponse = {
  ok?: boolean
  error?: string
  requestId?: string
  signedMessage?: unknown
}

export type GetPendingRequestMessage = {
  type: typeof API_GET_PENDING_REQUEST
}

export type GetPendingRequestResponse = {
  pendingRequest?: PendingRequest
  signRequestResults: SignRequestResult[]
}

export type ConfirmSignMessage = {
  type: typeof API_CONFIRM_SIGN
}

export type ConfirmSignResponse = {
  ok?: boolean
  error?: string
  signedMessage?: unknown
}

export type RejectSignMessage = {
  type: typeof API_REJECT_SIGN
}

export type ApiMessage =
  | IdentifyMessage
  | SignMessage
  | GetPendingRequestMessage
  | ConfirmSignMessage
  | RejectSignMessage

export type ApiResponseMap = {
  [API_IDENTIFY]: IdentifyResponse
  [API_SIGN]: SignResponse
  [API_CONFIRM_SIGN]: ConfirmSignResponse
}

export type ApiResponse<TType extends keyof ApiResponseMap> = ApiResponseMap[TType]

export const sendApiMessage = <TType extends keyof ApiResponseMap>(
  message: Extract<ApiMessage, { type: TType }>
): Promise<ApiResponse<TType>> => {
  return browser.runtime.sendMessage(message) as Promise<ApiResponse<TType>>
}
