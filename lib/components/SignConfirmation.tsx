import type { PendingRequest } from "../background/signFlow.ts"
import { confirmSignRequest, rejectSignRequest } from "@/lib/messaging/client/apiClient.ts"
import SignConfirmationForm from "../components/SignConfirmationForm.tsx"

type Props = {
  pendingRequest: PendingRequest
  onDone: () => void
}

const SignConfirmation = ({ pendingRequest, onDone }: Props) => {
  const handleConfirm = async () => {
    await confirmSignRequest()
    onDone()
  }

  const handleReject = async () => {
    await rejectSignRequest()
    onDone()
  }

  return (
    <>
      <SignConfirmationForm origin={ pendingRequest.origin } message={ pendingRequest.data } onConfirm={ handleConfirm } onReject={ handleReject } />
    </>
  )
}

export default SignConfirmation
