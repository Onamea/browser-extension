type Props = {
  origin: string
  message: unknown
  onConfirm: () => void
  onReject: () => void
}

const SignConfirmationForm = ({ origin, message, onConfirm, onReject }: Props) => {
  return (
    <div>
      <p>Sign request from <strong>{ origin }</strong></p>
      <pre>{ JSON.stringify(message, null, 2) }</pre>
      <button type="button" onClick={ onConfirm }>Confirm</button>
      <button type="button" onClick={ onReject }>Reject</button>
    </div>
  )
}

export default SignConfirmationForm
