import type { PendingRequest } from "../background/signFlow.ts"
import SignConfirmation from "./SignConfirmation.tsx"

type Props = {
  pendingRequest: PendingRequest
  clearPendingRequest: () => void
  refreshPendingRequest: () => Promise<PendingRequest | undefined>
}

const SignConfirmationDisplay = ({ pendingRequest, clearPendingRequest, refreshPendingRequest }: Props) => {
  return (
    <SignConfirmation pendingRequest={ pendingRequest } clearPendingRequest={ clearPendingRequest } refreshPendingRequest={ refreshPendingRequest } />
  )
}

export default SignConfirmationDisplay