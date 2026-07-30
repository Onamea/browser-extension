import { useNavigate } from "react-router-dom"
import type { ExtensionState } from "../background/state.ts"
import ContainerDisplay from "@/lib/components/ContainerDisplay.tsx"
import AddKeyPairForm from "@/lib/components/AddKeyPairForm.tsx"
import CreateKeyPairForm from "../components/CreateKeyPairForm.tsx"
import ClearContainerButton from "../components/ClearContainerButton.tsx"
import { useExtensionStateContext } from "@/lib/hooks/useExtensionStateContext.tsx"

type Props = {
  state: ExtensionState
}

const AccountEdit = ({ state }: Props) => {

  const navigate = useNavigate()
  const { clearData } = useExtensionStateContext()

  const onClick = () => {
    navigate("/account")
  }

  return (
    <div>
      <h1>Container</h1>
      <ContainerDisplay state={ state } />
      { state.data !== undefined && <ClearContainerButton onClear={ clearData } /> }
      { state.data === undefined && <AddKeyPairForm /> }
      { state.data === undefined && <CreateKeyPairForm /> }
      <button type="button" onClick={ onClick }>cancel</button>
    </div>
  )
}

export default AccountEdit
