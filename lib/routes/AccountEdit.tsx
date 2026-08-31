import type { ExtensionState } from "../background/state.ts"
import IdentityDisplay from "../components/IdentityDisplay.tsx"
import IdentityOperationsDisplay from "../components/IdentityOperationsDisplay.tsx"
import SetOperationForm from "../components/SetOperationForm.tsx"
import CreateKeyPairForm from "../components/CreateKeyPairForm.tsx"
import useView from "../hooks/useView.tsx"

type Props = {
  state: ExtensionState
}

const AccountEdit = ({ state }: Props) => {

  const { showAccount } = useView()
  const identity = state.local.identity

  if (identity === undefined) {
    return <p>You do not have an identity, yet.</p>
  }

  return (
    <div>
      <IdentityDisplay identity={ identity } />
      <IdentityOperationsDisplay identity={ identity } />
      <SetOperationForm state={ state } />
      <CreateKeyPairForm forSubKey />
      <menu>
        <button type="button" onClick={ showAccount }>Cancel</button>
      </menu>
    </div>
  )
}

export default AccountEdit
