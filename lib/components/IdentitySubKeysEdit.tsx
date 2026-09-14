import type { NameKey } from "@onamea/types"
import type { IdentityWithMessages } from "@onamea/crdt"
import useExtensionState from "../hooks/useExtensionState.ts"
import SubKeyDisplay from "./SubKeyDisplay.tsx"
import ErrorDisplay from "./ErrorDisplay.tsx"

type Props = {
  identity: IdentityWithMessages
}

const IdentitySubKeysEdit = ({ identity }: Props) => {

  const { createSignAndAppendOperation } = useExtensionState()
  const [error, setError] = useState<string>()

  const handleClick = async (subKey: NameKey) => {
    const grantOperation = identity.operations.find(operation => {
      return operation.type === "GRANT" && operation.subKey === subKey
    })
    if (grantOperation === undefined) {
      setError("No GRANT Operation found")
      return
    }
    const message = await createSignAndAppendOperation(identity, "REVOKE", grantOperation.hash)
    if (message === undefined) {
      setError(`Failed to create and sign RevokeOperation for ${ subKey }`)
      return
    }
    setError(undefined)
  }

  return (
    <ul>
      { identity.subKeys?.map(subKey => (
        <li key={ subKey.id }>
          <SubKeyDisplay subKey={ subKey } />
          { error !== undefined && <ErrorDisplay errors={ error } /> }
          <button type="button" onClick={ () => handleClick(subKey.id) }>Revoke</button>
        </li>
      )) }
    </ul>
  )
}

export default IdentitySubKeysEdit
