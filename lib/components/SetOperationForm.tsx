import { type ChangeEvent, type SubmitEvent, useState } from "react"
import type { KeyPairDisplay } from "@onamea/types"
import { type IdentityWithMessages, createSetOperation, getLatestHashFromOperations } from "@onamea/crdt"
import useExtensionState from "../hooks/useExtensionState.ts"

type Props = {
  identity: IdentityWithMessages
  keyPair: KeyPairDisplay
}

const SetOperationForm = ({ identity, keyPair }: Props) => {

  const { signAndAppendOperation } = useExtensionState()
  const [value, setValue] = useState(identity.body ?? "")

  const onChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setValue(event.target.value)
  }

  const onSubmit = async (event: SubmitEvent) => {
    event.preventDefault()
    const previousHash = getLatestHashFromOperations(identity.operations)
    if (previousHash === undefined) {
      console.error("No previous hash found for identity")
      return
    }
    try {
      const setOperation = await createSetOperation(identity.id, previousHash, value)
      await signAndAppendOperation(setOperation, keyPair)
      setValue("")
    } catch (error) {
      console.error("Failed to append operation:", error)
    }
  }

  return (
    <form onSubmit={ onSubmit }>
      <label htmlFor="value">{ identity.body ? "Update body" : "Set body" }:</label>
      <textarea value={ value } onChange={ onChange } />
      <button type="submit">Submit</button>
    </form>
  )
}

export default SetOperationForm
