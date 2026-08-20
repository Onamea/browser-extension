import type { IdentityWithMessages } from "@onamea/crdt"

type Props = {
  identity: IdentityWithMessages
}

const IdentityDisplay = ({ identity }: Props) => {
  return (
    <pre>{ JSON.stringify(identity, null, 2) }</pre>
  )
}

export default IdentityDisplay
