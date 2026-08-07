import type { PendingRequest } from "../background/signFlow.ts"
import { API_CONFIRM_SIGN, API_REJECT_SIGN } from "@/lib/messaging/api.ts"
import SignConfirmationForm from "../components/SignConfirmationForm.tsx"

type Props = {
  pendingRequest: PendingRequest
  onDone: () => void
}

const SignConfirmation = ({ pendingRequest, onDone }: Props) => {
  const handleConfirm = async () => {
    await browser.runtime.sendMessage({ type: API_CONFIRM_SIGN })
    onDone()
  }

  const handleReject = async () => {
    await browser.runtime.sendMessage({ type: API_REJECT_SIGN })
    onDone()
  }

  return (
    <>
      <SignConfirmationForm origin={ pendingRequest.origin } message={ pendingRequest.data } onConfirm={ handleConfirm } onReject={ handleReject } />
    </>
  )
}

export default SignConfirmation
