import type { FormEvent } from "react"
import type { Identifier } from "@vanice/crdt"
import { useState } from "react"
import ErrorDisplay from "./ErrorDisplay.tsx"
import { isPrivateKeyDisplay } from "@vanice/types"
import { isIdentifier } from "@vanice/crdt"

type Props = {
  onSubmit: (identifier: Identifier, privateKey: string) => Promise<void>
}

const AddKeyPairForm = ({ onSubmit }: Props) => {
  const [identifier, setIdentifier] = useState("")
  const [privateKey, setPrivateKey] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    if (!isIdentifier(identifier)) {
      setErrors(["Invalid Identifier"])
      setIsSubmitting(false)
      return
    }
    if (!isPrivateKeyDisplay(privateKey)) {
      setErrors(["Invalid PrivateKeyDisplay"])
      setIsSubmitting(false)
      return
    }
    await onSubmit(identifier, privateKey)
    setIsSubmitting(false)
  }

  return (
    <form onSubmit={ handleSubmit }>
      <div>
        <label htmlFor="identifier">Identifier:</label>
        <input
          id="identifier"
          type="text"
          value={ identifier }
          onChange={ event => setIdentifier(event.target.value) }
          placeholder="Identifier"
        />
      </div>
      <div>
        <label htmlFor="privateKey">Private key:</label>
        <input
          id="privateKey"
          type="password"
          value={ privateKey }
          onChange={ event => setPrivateKey(event.target.value) }
          placeholder="Private key"
        />
      </div>
      <ErrorDisplay errors={ errors } />
      <button type="submit" disabled={ isSubmitting }>{ isSubmitting ? "..." : "Add" }</button>
    </form>
  )
}

export default AddKeyPairForm
