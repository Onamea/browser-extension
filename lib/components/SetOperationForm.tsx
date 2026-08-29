import { type ChangeEvent, type FormEvent, useState } from "react"
import { createSetOperation, getLatestHashFromOperations } from "@onamea/crdt"
import type { ExtensionState } from "../background/state.ts"
import useExtensionState from "../hooks/useExtensionState.ts"

type Props = {
  state: ExtensionState
}

const SetOperationForm = ({ state }: Props) => {

  const { appendOperation } = useExtensionState()
  const [value, setValue] = useState("")

  const onChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setValue(event.target.value)
  }

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (state.local.identity === undefined) {
      console.error("No identity found")
      return
    }
    const previousHash = getLatestHashFromOperations(state.local.identity.operations)
    if (previousHash === undefined) {
      console.error("No previous hash found for identity")
      return
    }
    const setOperation = await createSetOperation(state.local.identity.id, previousHash, value)
    const isSuccess = await appendOperation(setOperation)
    if (isSuccess === false) {
      console.error("Failed to append operation")
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
