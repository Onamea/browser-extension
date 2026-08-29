import type { IdentityWithMessages } from "@onamea/crdt"

type Props = {
  identity: IdentityWithMessages
}

const IdentityDisplay = ({ identity }: Props) => {
  return (
    <div>
      <p><strong>NameKey:</strong> { identity.id }</p>
      <p><strong>tombstone:</strong> { identity.tombstone ? "true" : "false" }</p>
      <p><strong>body:</strong> { identity.body }</p>
      <p><strong>SubKeys:</strong> { JSON.stringify(identity.subKeys, null, 2) }</p>
      <p><strong>Referents:</strong> { JSON.stringify(identity.referents, null, 2) }</p>
    </div>
  )
}

export default IdentityDisplay
