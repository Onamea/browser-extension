import type { IdentityWithMessages } from "@onamea/crdt"

type Props = {
  identity: IdentityWithMessages
}

const IdentityOperationsDisplay = ({ identity }: Props) => {
  return (
    <div>
      <pre>{ JSON.stringify(identity.operations, null, 2) }</pre>
      <pre>{ JSON.stringify(identity.messages, null, 2) }</pre>
    </div>
  )
}

export default IdentityOperationsDisplay
