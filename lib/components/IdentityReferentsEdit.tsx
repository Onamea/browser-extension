import type { NameKey } from "@onamea/types"
import type { IdentityWithMessages } from "@onamea/crdt"
import useExtensionState from "../hooks/useExtensionState.ts"
import ErrorDisplay from "./ErrorDisplay.tsx"

type Props = {
  identity: IdentityWithMessages
}

const IdentityReferentsEdit = ({ identity }: Props) => {

  const { createSignAndAppendOperation } = useExtensionState()
  const [error, setError] = useState<string>()

  const handleClick = async (referent: NameKey) => {
    const vouchOperation = identity.operations.find(operation => {
      return operation.type === "VOUCH" && operation.referent === referent
    })
    if (vouchOperation === undefined) {
      setError("No VOUCH Operation found")
      return
    }
    const message = await createSignAndAppendOperation(identity, "DENOUNCE", vouchOperation.hash)
    if (message === undefined) {
      setError(`Failed to create and sign DenounceOperation for ${ referent }`)
      return
    }
    setError(undefined)
  }

  return (
    <ul>
      { identity.referents?.map(({ id, displayName }) => (
        <li key={ id }>
          { displayName ?? id }
          { error !== undefined && <ErrorDisplay errors={ error } /> }
          <button type="button" onClick={ () => handleClick(id) }>Denounce</button>
        </li>
      )) }
    </ul>
  )

}

export default IdentityReferentsEdit
