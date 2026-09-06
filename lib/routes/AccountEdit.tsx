import type { ExtensionState } from "../background/state.ts"
import IdentityDisplay from "../components/IdentityDisplay.tsx"
import IdentityOperationsDisplay from "../components/IdentityOperationsDisplay.tsx"
import SetOperationForm from "../components/SetOperationForm.tsx"
import TombstoneButton from "../components/TombstoneButton.tsx"
import IdentitySubKeysEdit from "../components/IdentitySubKeysEdit.tsx"
import CreateKeyPairForm from "../components/CreateKeyPairForm.tsx"
import useView from "../hooks/useView.tsx"

type Props = {
  state: ExtensionState
}

const AccountEdit = ({ state }: Props) => {

  const { showAccount } = useView()
  const identity = state.local.identity
  const keyPair = state.container.data?.identity.keyPair

  if (identity === undefined) {
    return <p>You do not have an identity, yet.</p>
  }

  if (keyPair === undefined) {
    return <p>You do not have a key pair for Identity, yet.</p>
  }

  return (
    <div>
      <IdentityDisplay identity={ identity } />
      <IdentityOperationsDisplay identity={ identity } />
      <TombstoneButton />
      <SetOperationForm />
      <IdentitySubKeysEdit identity={ identity } keyPair={ keyPair }/>
      <CreateKeyPairForm forSubKey />
      <menu>
        <button type="button" onClick={ showAccount }>Cancel</button>
      </menu>
    </div>
  )
}

export default AccountEdit
