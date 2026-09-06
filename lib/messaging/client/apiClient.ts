import type { PendingRequest, SignRequestResult } from "@/lib/background/signFlow.ts"
import type { Message } from "@onamea/crdt"
import { isMessage } from "@onamea/crdt"
import {
  type ConfirmSignResponse,
  API_CONFIRM_SIGN,
  API_GET_PENDING_REQUEST,
  API_REJECT_SIGN
} from "@/lib/messaging/api.ts"
import { sendRuntimeMessage } from "@/lib/messaging/client/runtime.ts"
import { isString } from "@/lib/utils/isString.ts"
import isObject from "@/lib/utils/isObject.ts"
import type { NameKey } from "@onamea/types"

export type GetPendingRequestResponse = {
  pendingRequest?: PendingRequest
  signRequestResults: SignRequestResult[]
}

const isPendingRequest = (value: unknown): value is PendingRequest => {
  if (isObject(value) === false) {
    return false
  }

  const candidate = value as { data?: unknown, requestId?: unknown, origin?: unknown }
  if (isString(candidate.requestId) === false) {
    return false
  }

  return isString(candidate.origin)
}

export const getPendingRequest = async (): Promise<GetPendingRequestResponse> => {
  const response = await sendRuntimeMessage<GetPendingRequestResponse>({ type: API_GET_PENDING_REQUEST })
  return {
    pendingRequest: isPendingRequest(response?.pendingRequest) ? response.pendingRequest : undefined,
    signRequestResults: response?.signRequestResults ?? []
  }
}

export const confirmSignRequest = async (key: NameKey): Promise<Message> => {
  const response = await sendRuntimeMessage<ConfirmSignResponse>({ type: API_CONFIRM_SIGN, key })
  if (response.error !== undefined) {
    throw new Error(response.error)
  }

  if (isMessage(response.signedMessage) === false) {
    throw new Error("No signed message returned")
  }

  return response.signedMessage
}

export const rejectSignRequest = async (): Promise<void> => {
  await sendRuntimeMessage({ type: API_REJECT_SIGN })
}
