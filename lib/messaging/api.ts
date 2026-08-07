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

export type GetPendingRequestMessage = {
  type: typeof API_GET_PENDING_REQUEST
}

export type ConfirmSignMessage = {
  type: typeof API_CONFIRM_SIGN
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
