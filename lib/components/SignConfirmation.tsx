import type { PendingRequest } from "../background/signFlow.ts"
import { confirmSignRequest, rejectSignRequest } from "@/lib/messaging/client/apiClient.ts"
import SignConfirmationForm from "../components/SignConfirmationForm.tsx"
import { appendMessageState } from "@/lib/messaging/client/stateClient.ts"

type Props = {
  pendingRequest: PendingRequest
  clearPendingRequest: () => void
  refreshPendingRequest: () => Promise<PendingRequest | undefined>
}

const SignConfirmation = ({ pendingRequest, clearPendingRequest, refreshPendingRequest }: Props) => {

  const refreshPendingRequestSafely = async () => {
    try {
      await refreshPendingRequest()
    } catch (error) {
      console.error("Failed to refresh pending sign request:", error)
      clearPendingRequest()
      globalThis.close()
    }
  }

  const closeIfNoPendingRequests = async () => {
    const nextPendingRequest = await refreshPendingRequest()
    if (nextPendingRequest === undefined) {
      clearPendingRequest()
      globalThis.close()
    }
  }

  const handleConfirm = async (shouldSaveLocally: boolean) => {
    try {
      const signedMessage = await confirmSignRequest()
      if (shouldSaveLocally) {
        const isAppended = await appendMessageState(signedMessage)
        if (isAppended === false) {
          console.error("Failed to append signed message to state")
        }
      }
      await closeIfNoPendingRequests()
    } catch (error) {
      console.error("Failed to confirm sign request:", error)
      await refreshPendingRequestSafely()
    }
  }

  const handleReject = async () => {
    try {
      await rejectSignRequest()
      await closeIfNoPendingRequests()
    } catch (error) {
      console.error("Failed to reject sign request:", error)
      await refreshPendingRequestSafely()
    }
  }

  return (
    <SignConfirmationForm origin={ pendingRequest.origin } message={ pendingRequest.data } onConfirm={ handleConfirm } onReject={ handleReject } />
  )
}

export default SignConfirmation
