import type { FormEvent } from "react"
import { useState } from "react"
import ErrorDisplay from "./ErrorDisplay.tsx"
import { isPassword } from "../container/main.ts"
import useExtensionState from "@/lib/hooks/useExtensionState.ts"

const CreatePassphraseForm = () => {
  const [passphrase, setPassphrase] = useState("")
  const [passphraseConfirm, setPassphraseConfirm] = useState("")
  const [errors, setErrors] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { createContainer } = useExtensionState()

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const validationErrors = isPassword(passphrase) ? [] : ["Invalid passphrase"]
    if (passphrase !== passphraseConfirm) {
      validationErrors.push("Passphrases do not match")
    }
    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      return
    }
    setErrors([])
    setIsSubmitting(true)
    try {
      const isSuccess = await createContainer(passphrase)
      if (isSuccess === false) {
        setErrors(["Failed to create container"])
      }
    } catch (error) {
      setErrors([String(error)])
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={ handleSubmit }>
      <div>
        <label htmlFor="passphrase">Passphrase:</label>
        <input
          id="passphrase"
          type="password"
          value={ passphrase }
          onChange={ event => setPassphrase(event.target.value) }
          placeholder="Passphrase"
        />
      </div>
      <div>
        <label htmlFor="passphraseConfirm">Confirm passphrase:</label>
        <input
          id="passphraseConfirm"
          type="password"
          value={ passphraseConfirm }
          onChange={ event => setPassphraseConfirm(event.target.value) }
          placeholder="Confirm passphrase"
        />
      </div>
      <ErrorDisplay errors={ errors } />
      <button type="submit" disabled={ isSubmitting }>{ isSubmitting ? "..." : "Create" }</button>
    </form>
  )
}

export default CreatePassphraseForm
