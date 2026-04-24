import { isOperation } from "@vanice/crdt"
import { sign } from "@/lib/sign.ts"
import type { UnlockedState } from "./state.ts"

export type PendingRequest = {
  data: unknown
  requestId: string
  origin: string
}

let pendingRequest: PendingRequest | undefined
let pendingSendResponse: ((response: unknown) => void) | undefined

export const getPendingRequest = () => pendingRequest

export const handleSign = (
  data: unknown,
  requestId: string,
  origin: string,
  sendResponse: (response: unknown) => void,
  openPopup: () => void
): true => {
  pendingRequest = { data, requestId, origin }
  pendingSendResponse = sendResponse
  openPopup()
  return true
}

export const handleConfirmSign = (
  unlocked: UnlockedState | undefined,
  sendResponse: (response: unknown) => void
): false => {
  if (pendingRequest === undefined || pendingSendResponse === undefined || unlocked === undefined || unlocked.slotData?.keyPair === undefined) {
    sendResponse({ error: "No pending request" })
    return false
  }
  const { data, requestId } = pendingRequest
  const resolve = pendingSendResponse
  pendingRequest = undefined
  pendingSendResponse = undefined
  sendResponse({ ok: true })
  if (isOperation(data) === false) {
    resolve({ error: "Data is not a valid Operation", requestId })
    return false
  }
  const keyPair = unlocked.slotData.keyPair
  sign(data, keyPair)
    .then(signedMessage => resolve({ signedMessage, requestId }))
    .catch(error => resolve({ error: String(error), requestId }))
  return false
}

export const handleRejectSign = (sendResponse: (response: unknown) => void): false => {
  if (pendingRequest !== undefined && pendingSendResponse !== undefined) {
    pendingSendResponse({ error: "rejected", requestId: pendingRequest.requestId })
    pendingRequest = undefined
    pendingSendResponse = undefined
  }
  sendResponse({ ok: true })
  return false
}
