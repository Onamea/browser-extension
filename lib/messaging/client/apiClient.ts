import type { PendingRequest } from "@/lib/background/signFlow.ts"
import {
  API_CONFIRM_SIGN,
  API_GET_PENDING_REQUEST,
  API_REJECT_SIGN
} from "@/lib/messaging/api.ts"
import { sendRuntimeMessage } from "@/lib/messaging/client/runtime.ts"
import { isString } from "@/lib/utils/isString.ts"
import isObject from "@/lib/utils/isObject.ts"

type GetPendingRequestResponse = {
  pendingRequest?: PendingRequest
  data?: unknown
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

export const getPendingRequest = async (): Promise<PendingRequest | undefined> => {
  const response = await sendRuntimeMessage<GetPendingRequestResponse>({ type: API_GET_PENDING_REQUEST })
  if (isPendingRequest(response?.pendingRequest) === false) {
    return undefined
  }

  return response.pendingRequest
}

export const confirmSignRequest = async (): Promise<void> => {
  await sendRuntimeMessage({ type: API_CONFIRM_SIGN })
}

export const rejectSignRequest = async (): Promise<void> => {
  await sendRuntimeMessage({ type: API_REJECT_SIGN })
}
