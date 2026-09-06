type Props = {
  errors: string |string[]
}

const ErrorDisplay = ({ errors }: Props) => {

  const uniqueErrors = (Array.isArray(errors) ? errors : [errors])
    .filter((error, index, self) => self.indexOf(error) === index)

  return (
    <>
      { uniqueErrors.map((error, index) => (
        <p className="error" key={ index }>{ error }</p>
      )) }
    </>
  )
}

export default ErrorDisplay
