import type { PendingRequest } from "../background/signFlow.ts"
import SignConfirmationForm from "../components/SignConfirmationForm.tsx"

type Props = {
  pendingRequest: PendingRequest
  onDone: () => void
}

const SignConfirmation = ({ pendingRequest, onDone }: Props) => {
  const handleConfirm = async () => {
    await browser.runtime.sendMessage({ type: "CONFIRM_SIGN" })
    onDone()
  }

  const handleReject = async () => {
    await browser.runtime.sendMessage({ type: "REJECT_SIGN" })
    onDone()
  }

  return (
    <SignConfirmationForm origin={ pendingRequest.origin } onConfirm={ handleConfirm } onReject={ handleReject } />
  )
}

export default SignConfirmation
