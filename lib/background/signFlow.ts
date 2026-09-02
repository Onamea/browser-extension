import { isOperation, signOperation } from "@onamea/crdt"
import type { ExtensionState } from "./state.ts"

export type PendingRequest = {
  data: unknown
  requestId: string
  origin: string
}

export type SignRequestResult = {
  requestId: string
  origin: string
  status: "signed" | "rejected" | "failed"
  error?: string
  timestamp: number
}

type PendingSignRequest = PendingRequest & {
  sendResponse: (response: unknown) => void
}

export const MAX_PENDING_SIGN_REQUESTS = 8

let pendingRequests: PendingSignRequest[] = []
let signRequestResults: SignRequestResult[] = []

const addSignRequestResult = (request: PendingRequest, status: SignRequestResult["status"], error?: string) => {
  const result: SignRequestResult = {
    requestId: request.requestId,
    origin: request.origin,
    status,
    error,
    timestamp: Date.now()
  }
  signRequestResults = [result, ...signRequestResults].slice(0, MAX_PENDING_SIGN_REQUESTS)
}

export const getPendingRequest = (): PendingRequest | undefined => {
  const pendingRequest = pendingRequests[0]
  if (pendingRequest === undefined) {
    return undefined
  }

  const { data, requestId, origin } = pendingRequest
  return { data, requestId, origin }
}

export const getSignRequestResults = (): SignRequestResult[] => signRequestResults

const getActivePendingRequest = (): PendingSignRequest | undefined => pendingRequests[0]

const dequeuePendingRequest = () => {
  pendingRequests = pendingRequests.slice(1)
}

const enqueuePendingRequest = (request: PendingSignRequest) => {
  pendingRequests = [...pendingRequests, request]
}

const rejectPendingRequests = (error: string) => {
  const requests = pendingRequests
  pendingRequests = []
  requests.forEach(request => {
    addSignRequestResult(request, "failed", error)
    request.sendResponse({ error, requestId: request.requestId })
  })
}

export const handleSign = (
  data: unknown,
  requestId: string,
  origin: string,
  sendResponse: (response: unknown) => void,
  openPopup: () => Promise<void>
): boolean => {
  if (pendingRequests.length >= MAX_PENDING_SIGN_REQUESTS) {
    sendResponse({ error: "Too many pending sign requests", requestId })
    return false
  }

  const wasEmpty = pendingRequests.length === 0
  enqueuePendingRequest({ data, requestId, origin, sendResponse })

  if (wasEmpty) {
    void openPopup().catch(() => {
      rejectPendingRequests("Unable to open sign confirmation")
    })
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
    addSignRequestResult(pendingRequest, "failed", "Data is not a valid Operation")
    sendResponse({ error: "Data is not a valid Operation" })
    pendingRequest.sendResponse({ error: "Data is not a valid Operation", requestId })
    return false
  }
  const keyPair = state.container.data.identity.keyPair
  signOperation(data, keyPair, Date.now())
    .then(signedMessage => {
      addSignRequestResult(pendingRequest, "signed")
      sendResponse({ ok: true, signedMessage })
      pendingRequest.sendResponse({ signedMessage, requestId })
    })
    .catch(error => {
      const errorMessage = String(error)
      addSignRequestResult(pendingRequest, "failed", errorMessage)
      sendResponse({ error: errorMessage })
      pendingRequest.sendResponse({ error: errorMessage, requestId })
    })
  return true
}

export const handleRejectSign = (sendResponse: (response: unknown) => void): false => {
  const pendingRequest = getActivePendingRequest()
  if (pendingRequest !== undefined) {
    dequeuePendingRequest()
    addSignRequestResult(pendingRequest, "rejected")
    pendingRequest.sendResponse({ error: "rejected", requestId: pendingRequest.requestId })
  }
  sendResponse({ ok: true })
  return false
}
