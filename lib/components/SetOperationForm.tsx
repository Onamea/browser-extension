import { type ChangeEvent, type SubmitEvent, useState } from "react"
import { createSetOperation, getLatestHashFromOperations } from "@onamea/crdt"
import useExtensionState from "../hooks/useExtensionState.ts"

const SetOperationForm = () => {

  const { state, signAndAppendOperation } = useExtensionState()
  const [value, setValue] = useState("")

  const onChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setValue(event.target.value)
  }

  const onSubmit = async (event: SubmitEvent) => {
    event.preventDefault()
    if (state.local.identity === undefined) {
      console.error("No identity found")
      return
    }
    if (state.container.data === undefined) {
      console.error("No container data found")
      return
    }
    const previousHash = getLatestHashFromOperations(state.local.identity.operations)
    if (previousHash === undefined) {
      console.error("No previous hash found for identity")
      return
    }
    try {
      const setOperation = await createSetOperation(state.local.identity.id, previousHash, value)
      await signAndAppendOperation(setOperation, state.container.data.identity.keyPair)
      setValue("")
    } catch (error) {
      console.error("Failed to append operation:", error)
    }
  }

  return (
    <form onSubmit={ onSubmit }>
      <label htmlFor="value">Update body:</label>
      <textarea value={ value } onChange={ onChange } />
      <button type="submit">Submit</button>
    </form>
  )
}

export default SetOperationForm
