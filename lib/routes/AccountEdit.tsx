import { useNavigate } from "react-router-dom"
import type { ExtensionState } from "../background/state.ts"
import ContainerDisplay from "@/lib/components/ContainerDisplay.tsx"
import AddKeyPairForm from "@/lib/components/AddKeyPairForm.tsx"
import CreateKeyPairForm from "../components/CreateKeyPairForm.tsx"
import ClearContainerButton from "../components/ClearContainerButton.tsx"

type Props = {
  state: ExtensionState
}

const AccountEdit = ({ state }: Props) => {

  const navigate = useNavigate()

  const onClick = () => {
    navigate("/account")
  }

  return (
    <div>
      <ContainerDisplay container={ state.container } />
      { state.container.data !== undefined && <section><ClearContainerButton /></section> }
      { state.container.data !== undefined && <section><button type="button" onClick={ onClick }>Cancel</button></section> }
      { state.container.data === undefined && <CreateKeyPairForm /> }
      { state.container.data === undefined && <AddKeyPairForm /> }
    </div>
  )
}

export default AccountEdit
