import { isOperation, signOperation } from "@onamea/crdt"
import type { ExtensionState } from "./state.ts"

export type PendingRequest = {
  data: unknown
  requestId: string
  origin: string
}

type PendingSignRequest = PendingRequest & {
  sendResponse: (response: unknown) => void
}

const MAX_PENDING_SIGN_REQUESTS = 8

let pendingRequests: PendingSignRequest[] = []

export const getPendingRequest = (): PendingRequest | undefined => {
  const pendingRequest = pendingRequests[0]
  if (pendingRequest === undefined) {
    return undefined
  }

  const { data, requestId, origin } = pendingRequest
  return { data, requestId, origin }
}

const getActivePendingRequest = (): PendingSignRequest | undefined => pendingRequests[0]

const dequeuePendingRequest = () => {
  pendingRequests = pendingRequests.slice(1)
}

const enqueuePendingRequest = (request: PendingSignRequest) => {
  pendingRequests = [...pendingRequests, request]
}

export const handleSign = (
  data: unknown,
  requestId: string,
  origin: string,
  sendResponse: (response: unknown) => void,
  openPopup: () => void
): boolean => {
  if (pendingRequests.length >= MAX_PENDING_SIGN_REQUESTS) {
    sendResponse({ error: "Too many pending sign requests", requestId })
    return false
  }

  const wasEmpty = pendingRequests.length === 0
  enqueuePendingRequest({ data, requestId, origin, sendResponse })

  if (wasEmpty) {
    openPopup()
  }

  return true
}

export const handleConfirmSign = (
  state: ExtensionState | undefined,
  sendResponse: (response: unknown) => void
): boolean => {
  const pendingRequest = getActivePendingRequest()
  if (pendingRequest === undefined || state?.container.data === undefined) {
    sendResponse({ error: "No pending request" })
    return false
  }

  const { data, requestId } = pendingRequest
  dequeuePendingRequest()
  if (isOperation(data) === false) {
    sendResponse({ error: "Data is not a valid Operation" })
    pendingRequest.sendResponse({ error: "Data is not a valid Operation", requestId })
    return false
  }
  const keyPair = state.container.data.identity.keyPair
  signOperation(data, keyPair, Date.now())
    .then(signedMessage => {
      sendResponse({ ok: true, signedMessage })
      pendingRequest.sendResponse({ signedMessage, requestId })
    })
    .catch(error => {
      sendResponse({ error: String(error) })
      pendingRequest.sendResponse({ error: String(error), requestId })
    })
  return true
}

export const handleRejectSign = (sendResponse: (response: unknown) => void): false => {
  const pendingRequest = getActivePendingRequest()
  if (pendingRequest !== undefined) {
    dequeuePendingRequest()
    pendingRequest.sendResponse({ error: "rejected", requestId: pendingRequest.requestId })
  }
  sendResponse({ ok: true })
  return false
}
