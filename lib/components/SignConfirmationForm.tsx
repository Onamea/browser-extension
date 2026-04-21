type Props = {
  origin: string
  onConfirm: () => void
  onReject: () => void
}

const SignConfirmationForm = ({ origin, onConfirm, onReject }: Props) => {
  return (
    <div>
      <p>Sign request from <strong>{ origin }</strong></p>
      <button type="button" onClick={ onConfirm }>Confirm</button>
      <button type="button" onClick={ onReject }>Reject</button>
    </div>
  )
}

export default SignConfirmationForm
