import { createDeleteOperation, getRootOperation } from "@onamea/crdt"
import useExtensionState from "../hooks/useExtensionState.ts"

const TombstoneButton = () => {

  const { state, signAndAppendOperation } = useExtensionState()
  const keyPair = state.container.data?.identity.keyPair
  const identity = state.local.identity

  if (keyPair === undefined || identity === undefined) {
    return null
  }

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
        await signAndAppendOperation(tombstoneOperation, keyPair)
      } catch (error) {
        console.error("Failed to tombstone identity:", error)
      }
    })()
  }

  return <button type="button" onClick={ onClick }>Tombstone</button>
}

export default TombstoneButton
