import type { FormEvent } from "react"
import { useState } from "react"
import { readSession } from "@/lib/container.ts"
import ErrorDisplay from "./ErrorDisplay.tsx"
import { isPassword } from "@/lib/container/main.ts"

type Props = {
  setData: (data: string, accessKey: string) => void
}

const PassphraseEntryForm = ({ setData }: Props) => {
  const [passphrase, setPassphrase] = useState("")
  const [errors, setErrors] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const errors = isPassword(passphrase) ? [] : ["Invalid passphrase"]
    if (errors.length > 0) {
      setErrors(errors)
      return
    }
    setErrors([])
    setIsSubmitting(true)
    const sessionResult = await readSession(passphrase)
    setIsSubmitting(false)
    if (sessionResult !== undefined && sessionResult.accessKey !== undefined) {
      setData(sessionResult.content ?? "", sessionResult.accessKey)
    } else {
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
