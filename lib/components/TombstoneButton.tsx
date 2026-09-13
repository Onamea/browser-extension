import { type IdentityWithMessages, createDeleteOperation, getRootOperation } from "@onamea/crdt"
import useExtensionState from "../hooks/useExtensionState.ts"

type Props = {
  identity: IdentityWithMessages
}

const TombstoneButton = ({ identity }: Props) => {

  const { signAndAppendOperation } = useExtensionState()

  const onClick = () => {

    const confirmed = globalThis.confirm(`Are you sure you want to tombstone Identity: ${ identity.id }?`)
    if (confirmed === false) return
    
    void (async () => {
      try {
        const rootOperation = getRootOperation(identity.id, identity.operations ?? [])
        if (rootOperation === undefined) {
          throw new Error("No root operation found for identity")
        }
        const tombstoneOperation = await createDeleteOperation(identity.id, rootOperation.hash)
        await signAndAppendOperation(tombstoneOperation, identity.id)
      } catch (error) {
        console.error("Failed to tombstone identity:", error)
      }
    })()
  }

  return <button type="button" onClick={ onClick }>Tombstone</button>
}

export default TombstoneButton
