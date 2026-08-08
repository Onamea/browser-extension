import type { FormEvent } from "react"
import { useState } from "react"
import ErrorDisplay from "./ErrorDisplay.tsx"
import { isPassword } from "@/lib/container/main.ts"
import useExtensionState from "@/lib/hooks/useExtensionState.ts"

const PassphraseEntryForm = () => {
  const [passphrase, setPassphrase] = useState("")
  const [errors, setErrors] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { signIn } = useExtensionState()

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const errors = []
    if (passphrase.length === 0) {
      errors.push("Password required")
    } else if (isPassword(passphrase) === false) {
      errors.push("Invalid password")
    }
    if (errors.length > 0) {
      setErrors(errors)
      return
    }
    setErrors([])
    setIsSubmitting(true)
    const isSuccess = await signIn(passphrase)
    setIsSubmitting(false)
    if (isSuccess === false) {
      setErrors(["Incorrect password"])
    }
  }

  return (
    <section>
      <form onSubmit={ handleSubmit }>
        <div>
          <label htmlFor="passphrase">Password:</label>
          <input
            id="passphrase"
            type="password"
            value={ passphrase }
            onChange={ event => setPassphrase(event.target.value) }
          />
        </div>
        <button type="submit" disabled={ isSubmitting }>{ isSubmitting ? "..." : "Submit" }</button>
        <ErrorDisplay errors={ errors } />
      </form>
    </section>
  )
}

export default PassphraseEntryForm
