import { type SubmitEvent, useState } from "react"
import ErrorDisplay from "./ErrorDisplay.tsx"
import { isPassword } from "../container/main.ts"
import useExtensionState from "@/lib/hooks/useExtensionState.ts"

const CreatePasswordForm = () => {
  const [password, setPassword] = useState("")
  const [passwordConfirm, setPasswordConfirm] = useState("")
  const [errors, setErrors] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { createContainer } = useExtensionState()

  const handleSubmit = async (event: SubmitEvent) => {
    event.preventDefault()
    const validationErrors = isPassword(password) ? [] : ["Invalid password"]
    if (password !== passwordConfirm) {
      validationErrors.push("Passwords do not match")
    }
    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      return
    }
    setErrors([])
    setIsSubmitting(true)
    try {
      const isSuccess = await createContainer(password)
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
        <label htmlFor="password">Password:</label>
        <input
          id="password"
          type="password"
          value={ password }
          onChange={ event => setPassword(event.target.value) }
        />
      </div>
      <div>
        <label htmlFor="passwordConfirm">Confirm password:</label>
        <input
          id="passwordConfirm"
          type="password"
          value={ passwordConfirm }
          onChange={ event => setPasswordConfirm(event.target.value) }
        />
      </div>
      <ErrorDisplay errors={ errors } />
      <button type="submit" disabled={ isSubmitting }>{ isSubmitting ? "..." : "Save" }</button>
    </form>
  )
}

export default CreatePasswordForm
