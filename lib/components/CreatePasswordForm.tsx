import { type SubmitEvent, useState } from "react"
import ErrorDisplay from "./ErrorDisplay.tsx"
import { isPassword, passwordStrength as getPasswordStrength } from "../container/main.ts"
import useExtensionState from "@/lib/hooks/useExtensionState.ts"
import PasswordStrength from "./PasswordStrength.tsx"

import "./CreatePasswordForm.css"

const CreatePasswordForm = () => {
  const [password, setPassword] = useState("")
  const [passwordStrength, setPasswordStrength] = useState<[number, string | undefined]>([0, undefined])
  const showPasswordConfirm = passwordStrength[0] >= 6
  const [passwordConfirm, setPasswordConfirm] = useState("")
  useEffect(() => { 
    setPasswordConfirm("")
  }, [showPasswordConfirm])
  const [errors, setErrors] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { createContainer } = useExtensionState()

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = event.target.value
    console.log(newPassword.length)
    setPassword(newPassword)
    if (newPassword === "") {
      setPasswordStrength([0, undefined])
    } else {
      setPasswordStrength(getPasswordStrength(newPassword))
    }
  }

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
    <form onSubmit={ handleSubmit } className="create-password-form">
      <div>
        <label htmlFor="password">Password:</label>
        <input
          id="password"
          type="password"
          value={ password }
          onChange={ handleChange }
          style={{ marginBottom: 0 }}
        />
        { <PasswordStrength strength={ passwordStrength } /> }
      </div>
      { showPasswordConfirm && (
        <div>
          <label htmlFor="passwordConfirm">Confirm password:</label>
          <input
            id="passwordConfirm"
            type="password"
            value={ passwordConfirm }
            onChange={ event => setPasswordConfirm(event.target.value) }
          />
        </div>
      ) }
      <ErrorDisplay errors={ errors } />
      <button type="submit" disabled={ isSubmitting }>{ isSubmitting ? "..." : "Save" }</button>
    </form>
  )
}

export default CreatePasswordForm
