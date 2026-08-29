import IdentityDisplay from "../components/IdentityDisplay.tsx"
import type { ExtensionState } from "../background/state.ts"
import SignOutButton from "../components/SignOutButton.tsx"
import useView from "../hooks/useView.tsx"

type Props = {
  state: ExtensionState
}

const Account = ({ state }: Props) => {

  const { showAccountEdit, showContainer } = useView()
  const identity = state.local.identity

  if (identity === undefined) {
    return <p>You do not have an identity, yet.</p>
  }

  return (
    <>
      <h1>{ identity.fingerprintedName }</h1>
      <IdentityDisplay identity={ identity } />
      <menu>
        <button type="button" onClick={ showAccountEdit }>Edit</button>
        <button type="button" onClick={ showContainer }>Container</button>
        <SignOutButton />
      </menu>
    </>
  )
}

export default Account
