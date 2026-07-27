import { useNavigate } from "react-router-dom"
import type { ExtensionState } from "../background/state.ts"
import ContainerDisplay from "@/lib/components/ContainerDisplay.tsx"
import AddKeyPairForm from "@/lib/components/AddKeyPairForm.tsx"
import CreateKeyPairForm from "../components/CreateKeyPairForm.tsx"
import ClearContainerButton from "../components/ClearContainerButton.tsx"

type Props = {
  state: ExtensionState
  setData: (data: string) => Promise<void>
  clearData: () => Promise<void>
}

const AccountEdit = ({ state, setData, clearData }: Props) => {

  const navigate = useNavigate()

  const onClick = () => {
    navigate("/account")
  }

  return (
    <div>
      <h1>Container</h1>
      <ContainerDisplay state={ state } />
      { state.data !== undefined && <ClearContainerButton onClear={ clearData } /> }
      { state.data === undefined && <AddKeyPairForm setData={ setData } /> }
      { state.data === undefined && <CreateKeyPairForm setData={ setData } /> }
      <button type="button" onClick={ onClick }>cancel</button>
    </div>
  )
}

export default AccountEdit
