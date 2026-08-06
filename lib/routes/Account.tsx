import { useNavigate } from "react-router-dom"
import type { ExtensionState } from "../background/state.ts"
import ContainerDisplay from "../components/ContainerDisplay.tsx"
import SignOutButton from "../components/SignOutButton.tsx"

type Props = {
  state: ExtensionState
}

const Account = ({ state }: Props) => {

  const navigate = useNavigate()

  const onClick = () => {
    navigate("/account/edit")
  }

  return (
    <>
      <ContainerDisplay state={ state } />
      <button type="button" onClick={ onClick }>Edit</button>
      <SignOutButton />
    </>
  )
}

export default Account
