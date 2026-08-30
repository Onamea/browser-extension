import { useState } from "react"

type Props = {
  origin: string
  message: unknown
  onConfirm: (shouldSaveLocally: boolean) => void
  onReject: () => void
}

const SignConfirmationForm = ({ origin, message, onConfirm, onReject }: Props) => {

  const [checked, setChecked] = useState(false)

  return (
    <div>
      <p>Sign request from <strong>{ origin }</strong></p>
      <pre>{ JSON.stringify(message, null, 2) }</pre>
      <label>
        <input type="checkbox" checked={ checked } onChange={ e => setChecked(e.target.checked) } />Save Message locally
      </label>
      <menu>
        <button type="button" onClick={ () => onConfirm(checked) }>Confirm</button>
        <button type="button" onClick={ onReject }>Reject</button>
      </menu>
    </div>
  )
}

export default SignConfirmationForm
