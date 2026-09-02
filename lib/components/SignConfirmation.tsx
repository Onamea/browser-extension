import type { PendingRequest } from "../background/signFlow.ts"
import usePendingRequest from "@/lib/hooks/usePendingRequest.ts"
import { confirmSignRequest, rejectSignRequest } from "@/lib/messaging/client/apiClient.ts"
import SignConfirmationForm from "../components/SignConfirmationForm.tsx"
import { appendMessageState } from "@/lib/messaging/client/stateClient.ts"

type Props = {
  pendingRequest: PendingRequest
}

const SignConfirmation = ({ pendingRequest }: Props) => {
  const { clearPendingRequest, refreshPendingRequest } = usePendingRequest()

  const closeIfNoPendingRequests = async () => {
    const nextPendingRequest = await refreshPendingRequest()
    if (nextPendingRequest === undefined) {
      clearPendingRequest()
      globalThis.close()
    }
  }

  const handleConfirm = async (shouldSaveLocally: boolean) => {
    const signedMessage = await confirmSignRequest()
    if (shouldSaveLocally) {
      if (signedMessage === undefined) {
        console.error("No signed message returned to save locally")
      } else {
        await appendMessageState(signedMessage)
      }
    }
    await closeIfNoPendingRequests()
  }

  const handleReject = async () => {
    await rejectSignRequest()
    await closeIfNoPendingRequests()
  }

  return (
    <SignConfirmationForm origin={ pendingRequest.origin } message={ pendingRequest.data } onConfirm={ handleConfirm } onReject={ handleReject } />
  )
}

export default SignConfirmation
