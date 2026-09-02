import { useState } from "react"

type Props = {
  origin: string
  message: unknown
  onConfirm: (shouldSaveLocally: boolean) => Promise<void>
  onReject: () => Promise<void>
}

const SignConfirmationForm = ({ origin, message, onConfirm, onReject }: Props) => {

  const [checked, setChecked] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleConfirm = async () => {
    setIsSubmitting(true)
    try {
      await onConfirm(checked)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReject = async () => {
    setIsSubmitting(true)
    try {
      await onReject()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      <p>Sign request from <strong>{ origin }</strong></p>
      <pre>{ JSON.stringify(message, null, 2) }</pre>
      <label>
        <input type="checkbox" checked={ checked } onChange={ e => setChecked(e.target.checked) } />Save Message locally
      </label>
      <menu>
        <button type="button" disabled={ isSubmitting } onClick={ handleConfirm }>Confirm</button>
        <button type="button" disabled={ isSubmitting } onClick={ handleReject }>Reject</button>
      </menu>
    </div>
  )
}

export default SignConfirmationForm
