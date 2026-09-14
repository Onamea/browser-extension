import { type ChangeEvent, type SubmitEvent, useState } from "react"
import type { IdentityWithMessages } from "@onamea/crdt"
import useExtensionState from "../hooks/useExtensionState.ts"
import ErrorDisplay from "./ErrorDisplay.tsx"

type Props = {
  identity: IdentityWithMessages
}

const SetOperationForm = ({ identity }: Props) => {

  const { createSignAndAppendOperation } = useExtensionState()
  const [value, setValue] = useState(identity.body ?? "")
  const [error, setError] = useState<string>()

  const onChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setValue(event.target.value)
  }

  const onSubmit = async (event: SubmitEvent) => {
    event.preventDefault()
    setError(undefined)

    const message = await createSignAndAppendOperation(identity, "SET", value)
    if (message === undefined) {
      setError("Failed to set body")
      return
    }

    setValue("")
  }

  return (
    <form onSubmit={ onSubmit }>
      <label htmlFor="value">{ identity.body ? "Update body" : "Set body" }:</label>
      <textarea value={ value } onChange={ onChange } />
      { error !== undefined && <ErrorDisplay errors={ error } /> }
      <button type="submit">Submit</button>
    </form>
  )
}

export default SetOperationForm
