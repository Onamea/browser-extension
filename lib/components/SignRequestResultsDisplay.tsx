import type { SignRequestResult } from "../background/signFlow.ts"

type Props = {
  results: SignRequestResult[]
  onDismiss: () => void
}

const SignRequestResultsDisplay = ({ results, onDismiss }: Props) => {
  return (
    <div>
      { results.map(result => (
        <p key={ result.requestId }>
          Sign request from <strong>{ result.origin }</strong>: { result.status }{ result.error === undefined ? "" : ` (${ result.error })` }
        </p>
      )) }
      <button type="button" onClick={ onDismiss }>Dismiss</button>
    </div>
  )
}

export default SignRequestResultsDisplay
