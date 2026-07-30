import type { FormEvent } from "react"
import { useState } from "react"
import ErrorDisplay from "./ErrorDisplay.tsx"
import { isPassword } from "@/lib/container/main.ts"
import { useExtensionStateContext } from "@/lib/hooks/useExtensionStateContext.tsx"

const PassphraseEntryForm = () => {
  const [passphrase, setPassphrase] = useState("")
  const [errors, setErrors] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { signIn } = useExtensionStateContext()

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const errors = isPassword(passphrase) ? [] : ["Invalid passphrase"]
    if (errors.length > 0) {
      setErrors(errors)
      return
    }
    setErrors([])
    setIsSubmitting(true)
    const isSuccess = await signIn(passphrase)
    setIsSubmitting(false)
    if (isSuccess === false) {
      setErrors(["Incorrect passphrase"])
    }
  }

  return (
    <form onSubmit={ handleSubmit }>
      <label htmlFor="passphrase">Passphrase:</label>
      <input
        id="passphrase"
        type="password"
        value={ passphrase }
        onChange={ event => setPassphrase(event.target.value) }
        placeholder="Passphrase"
      />
      <button type="submit" disabled={ isSubmitting }>{ isSubmitting ? "..." : "Submit" }</button>
      <ErrorDisplay errors={ errors } />
    </form>
  )
}

export default PassphraseEntryForm
