import type { IdentityWithMessages } from "@onamea/crdt"
import TombstoneButton from "./TombstoneButton.tsx"
import SetOperationForm from "./SetOperationForm.tsx"
import BodyDisplay from "./BodyDisplay.tsx"

type Props = {
  identity: IdentityWithMessages
}

const IdentityEdit = ({ identity }: Props) => {
  return (
    <div>
      <p><strong>tombstone: </strong> { identity.tombstone ? "true" : "false" }</p>
      { identity.tombstone === false && <TombstoneButton identity={ identity } /> }
      <p><strong>body: </strong><BodyDisplay body={ identity.body } /></p>
      <SetOperationForm identity={ identity } />
    </div>
  )
} 

export default IdentityEdit
