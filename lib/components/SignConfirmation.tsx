import type { NameKey } from "@onamea/types"
import type { PendingRequest } from "../background/signFlow.ts"
import { confirmSignRequest, rejectSignRequest } from "@/lib/messaging/client/apiClient.ts"
import SignConfirmationForm from "../components/SignConfirmationForm.tsx"
import { appendMessageState } from "@/lib/messaging/client/stateClient.ts"
import useExtensionState from "../hooks/useExtensionState.ts"
import ErrorDisplay from "./ErrorDisplay.tsx"

type Props = {
  pendingRequest: PendingRequest
  clearPendingRequest: () => void
  refreshPendingRequest: () => Promise<PendingRequest | undefined>
}

const SignConfirmation = ({ pendingRequest, clearPendingRequest, refreshPendingRequest }: Props) => {

  const { origin, data: message } = pendingRequest
  const { state: { local: { identity } } } = useExtensionState()

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

  const handleConfirm = async (key: NameKey, shouldSaveLocally: boolean) => {
    try {
      const signedMessage = await confirmSignRequest(key)
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
    <>
      <p>Sign request from <strong>{ origin }</strong></p>
      <pre>{ JSON.stringify(message, null, 2) }</pre>
      { identity !== undefined
        ? <SignConfirmationForm identity={ identity } pageOrigin={ origin } onConfirm={ handleConfirm } onReject={ handleReject } />
        : <>
            <ErrorDisplay errors="No identity found. Please set up your identity in the extension." />
            <button type="button" onClick={ handleReject }>Reject</button>
          </>
      }
    </>
  )
}

export default SignConfirmation
