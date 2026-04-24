type Props = {
  errors: string[]
}

// TODO: Filter unique or append index to duplicate error messages

const ErrorDisplay = ({ errors }: Props) => (
  <>
    { errors.map(error => (
      <p key={ error }>{ error }</p>
    )) }
  </>
)

export default ErrorDisplay
