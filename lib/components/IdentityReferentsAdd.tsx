import { type SubmitEvent, useState } from "react"
import { isNameKey } from "@onamea/types"
import { type IdentityWithMessages, createVouchOperation, getRootOperation } from "@onamea/crdt"
import useExtensionState from "../hooks/useExtensionState.ts"
import ErrorDisplay from "./ErrorDisplay.tsx"

type Props = {
  identity: IdentityWithMessages
}

const IdentityReferentsAdd = ({ identity }: Props) => {

  const { signAndAppendOperation } = useExtensionState()
  const [referent, setReferent] = useState("")
  const [error, setError] = useState<string>()

  const handleSubmit = async (event: SubmitEvent) => {
    event.preventDefault()
    setError(undefined)

    if (isNameKey(referent) === false) {
      setError("Referent must be a valid NameKey")
      return
    }

    try {
      const createOperation = getRootOperation(identity.id, identity.operations)
      if (createOperation === undefined) {
        throw new Error("CREATE operation not found for identity")
      }
      const vouchOperation = await createVouchOperation(identity.id, createOperation.hash, referent)
      await signAndAppendOperation(vouchOperation, identity.id)
      setReferent("")
    } catch (error) {
      console.error("Failed to vouch for referent:", error)
    }
  }

  return (
    <form onSubmit={ handleSubmit }>
      <div>
        <label>Referent:</label>
        <input type="text" value={ referent } onChange={ e => setReferent(e.target.value) } />
      </div>
      <div>
        { error !== undefined && <ErrorDisplay errors={ error } /> }
      </div>
      <div>
        <button type="submit">Vouch</button>
      </div>
    </form>
  )
}

export default IdentityReferentsAdd
