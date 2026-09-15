import { type SubmitEvent, useState } from "react"
import ErrorDisplay from "./ErrorDisplay.tsx"
import { isPassword } from "@/lib/container/main.ts"
import useExtensionState from "@/lib/hooks/useExtensionState.ts"

const PasswordEntryForm = () => {
  const [password, setPassword] = useState("")
  const [errors, setErrors] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { signIn } = useExtensionState()

  const handleSubmit = async (event: SubmitEvent) => {
    event.preventDefault()
    const errors = []
    if (password.length === 0) {
      errors.push("Password required")
    } else if (isPassword(password) === false) {
      errors.push("Invalid password")
    }
    if (errors.length > 0) {
      setErrors(errors)
      return
    }
    setErrors([])
    setIsSubmitting(true)
    const isSuccess = await signIn(password)
    setIsSubmitting(false)
    if (isSuccess === false) {
      setErrors(["Incorrect password"])
    }
  }

  return (
    <section>
      <form onSubmit={ handleSubmit }>
        <div>
          <label htmlFor="password">Password:</label>
          <input
            id="password"
            type="password"
            value={ password }
            onChange={ event => setPassword(event.target.value) }
          />
        </div>
        <button type="submit" disabled={ isSubmitting }>{ isSubmitting ? "..." : "Submit" }</button>
        <ErrorDisplay errors={ errors } />
      </form>
    </section>
  )
}

export default PasswordEntryForm
