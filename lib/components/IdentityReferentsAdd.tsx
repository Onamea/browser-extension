import { type FormEvent, useState } from "react"
import { isNameKey, type KeyPairDisplay } from "@onamea/types"
import { createVouchOperation, getRootOperation } from "@onamea/crdt"
import type { ExtendedIdentityWithMessages } from "../background/state.ts"
import useExtensionState from "../hooks/useExtensionState.ts"
import ErrorDisplay from "./ErrorDisplay.tsx"

type Props = {
  identity: ExtendedIdentityWithMessages
  keyPair: KeyPairDisplay
}

const IdentityReferentsAdd = ({ identity, keyPair }: Props) => {

  const { signAndAppendOperation } = useExtensionState()
  const [referent, setReferent] = useState("")
  const [error, setError] = useState<string>()

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
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
      await signAndAppendOperation(vouchOperation, keyPair)
      setReferent("")
    } catch (error) {
      console.error("Failed to vouch for referent:", error)
    }
  }

  return (
    <form onSubmit={ handleSubmit }>
      <label>
        Referent:
        <input type="text" value={ referent } onChange={ e => setReferent(e.target.value) } />
      </label>
      { error !== undefined && <ErrorDisplay errors={ error } /> }
      <button type="submit">Vouch</button>
    </form>
  )
}

export default IdentityReferentsAdd
