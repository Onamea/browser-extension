import type { IdentityWithMessages } from "@onamea/crdt"
import SubKeysDisplay from "./SubKeysDisplay.tsx"
import ReferentsDisplay from "./ReferentsDisplay.tsx"
import BodyDisplay from "./BodyDisplay.tsx"

type Props = {
  identity: IdentityWithMessages
}

const IdentityDisplay = ({ identity }: Props) => {
  return (
    <div>
      <p><strong>NameKey: </strong>{ identity.id }</p>
      <p><strong>tombstone: </strong>{ identity.tombstone ? "true" : "false" }</p>
      <p><strong>body: </strong><BodyDisplay body={ identity.body } /></p>
      <p><strong>SubKeys:</strong></p> 
      { identity.subKeys && <SubKeysDisplay subKeys={ identity.subKeys } /> }
      <p><strong>Referents:</strong></p>
      { identity.referents && <ReferentsDisplay referents={ identity.referents } /> }
    </div>
  )
}

export default IdentityDisplay
