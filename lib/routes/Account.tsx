import type { IdentityWithMessages } from "@onamea/crdt"
import { useNavigate } from "react-router-dom"
import IdentityDisplay from "../components/IdentityDisplay.tsx"
import type { ExtensionState } from "../background/state.ts"
import ContainerDisplay from "../components/ContainerDisplay.tsx"
import SignOutButton from "../components/SignOutButton.tsx"
import useFingerprintedName from "../hooks/useFingerprintedName.ts"

type Props = {
  state: ExtensionState
  identity: IdentityWithMessages | undefined
}

const Account = ({ state, identity }: Props) => {

  const navigate = useNavigate()
  const fingerprintedName = useFingerprintedName(identity)

  const onClick = () => {
    navigate("/account/edit")
  }

  return (
    <>
      { identity !== undefined && <h1>{ fingerprintedName }</h1> }
      <ContainerDisplay container={ state.container } />
      <section><button type="button" onClick={ onClick }>Edit</button></section>
      { identity !== undefined && <IdentityDisplay identity={ identity } /> }
      <section><SignOutButton /></section>
    </>
  )
}

export default Account
