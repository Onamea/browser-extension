import type { ExtendedIdentityWithMessages } from "../background/state.ts"
import SubKeysDisplay from "./SubKeysDisplay.tsx"
import ReferentsDisplay from "./ReferentsDisplay.tsx"

type Props = {
  identity: ExtendedIdentityWithMessages
}

const IdentityDisplay = ({ identity }: Props) => {
  return (
    <div>
      <p><strong>NameKey:</strong> { identity.id }</p>
      <p><strong>tombstone:</strong> { identity.tombstone ? "true" : "false" }</p>
      <p><strong>body:</strong> { identity.body }</p>
      <p><strong>SubKeys:</strong></p> 
      <SubKeysDisplay subKeys={ identity.subKeys } />
      <p><strong>Referents:</strong></p>
      <ReferentsDisplay referents={ identity.referents } />
    </div>
  )
}

export default IdentityDisplay
