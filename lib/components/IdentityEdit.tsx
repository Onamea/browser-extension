import type { KeyPairDisplay } from "@onamea/types"
import type { ExtendedIdentityWithMessages } from "../background/state.ts"
import TombstoneButton from "./TombstoneButton.tsx"
import SetOperationForm from "./SetOperationForm.tsx"
import BodyDisplay from "./BodyDisplay.tsx"

type Props = {
  identity: ExtendedIdentityWithMessages
  keyPair: KeyPairDisplay
}

const IdentityEdit = ({ identity, keyPair }: Props) => {
  return (
    <div>
      <p><strong>tombstone: </strong> { identity.tombstone ? "true" : "false" }</p>
      { identity.tombstone === false && <TombstoneButton identity={ identity } keyPair={ keyPair } /> }
      <p><strong>body: </strong><BodyDisplay body={ identity.body } /></p>
      <SetOperationForm identity={ identity } keyPair={ keyPair } />
    </div>
  )
} 

export default IdentityEdit
