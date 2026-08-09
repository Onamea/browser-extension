import type { PendingRequest } from "../background/signFlow.ts"
import usePendingRequest from "@/lib/hooks/usePendingRequest.ts"
import { confirmSignRequest, rejectSignRequest } from "@/lib/messaging/client/apiClient.ts"
import SignConfirmationForm from "../components/SignConfirmationForm.tsx"

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

  const handleConfirm = async () => {
    await confirmSignRequest()
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
