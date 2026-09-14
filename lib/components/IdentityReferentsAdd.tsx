import { type SubmitEvent, useState } from "react"
import { isNameKey } from "@onamea/types"
import type { IdentityWithMessages } from "@onamea/crdt"
import useExtensionState from "../hooks/useExtensionState.ts"
import ErrorDisplay from "./ErrorDisplay.tsx"

type Props = {
  identity: IdentityWithMessages
}

const IdentityReferentsAdd = ({ identity }: Props) => {

  const { createSignAndAppendOperation } = useExtensionState()
  const [referent, setReferent] = useState("")
  const [error, setError] = useState<string>()

  const handleSubmit = async (event: SubmitEvent) => {
    event.preventDefault()
    setError(undefined)

    if (isNameKey(referent) === false) {
      setError("Referent must be a valid NameKey")
      return
    }

    const message = await createSignAndAppendOperation(identity, "VOUCH", referent)
    if (message === undefined) {
      setError(`Failed to create and sign VouchOperation for ${ referent }`)
      return
    }

    setReferent("")
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
