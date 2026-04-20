type Props = {
  errors: string[]
}

const ErrorDisplay = ({ errors }: Props) => (
  <>
    { errors.map(error => (
      <p key={ error }>{ error }</p>
    )) }
  </>
)

export default ErrorDisplay
