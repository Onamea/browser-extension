import { type Identity, createDeleteOperation, getRootOperation } from "@onamea/crdt"
import useExtensionState from "../hooks/useExtensionState.ts"

type Props = {
  identity: Identity
}
const TombstoneButton = ({ identity }: Props) => {

  const { appendOperation } = useExtensionState()

  const onClick = () => {

    const confirmed = globalThis.confirm(`Are you sure you want to tombstone the identity "${ identity.id }"?`)
    if (confirmed === false) return
    
    void (async () => {
      const rootOperation = getRootOperation(identity.id, identity.operations ?? [])
      if (rootOperation === undefined) {
        throw new Error("No root operation found for identity")
      }
      const tombstoneOperation = await createDeleteOperation(identity.id, rootOperation.hash)
      await appendOperation(tombstoneOperation)
    })()
  }

  return <button type="button" onClick={ onClick }>Tombstone</button>
}

export default TombstoneButton
