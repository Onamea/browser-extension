type Props = {
  body: string | undefined
}

const BodyDisplay = ({ body }: Props) => {
  return (
    <span style={ { whiteSpace: "pre-wrap" } }>{ body ?? <i>Empty body</i> }</span>
  )
}

export default BodyDisplay
