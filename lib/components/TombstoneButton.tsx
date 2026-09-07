import type { KeyPairDisplay } from "@onamea/types"
import { createDeleteOperation, getRootOperation } from "@onamea/crdt"
import type { ExtendedIdentityWithMessages } from "../background/state.ts"
import useExtensionState from "../hooks/useExtensionState.ts"

type Props = {
  identity: ExtendedIdentityWithMessages
  keyPair: KeyPairDisplay
}

const TombstoneButton = ({ identity, keyPair }: Props) => {

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
        await signAndAppendOperation(tombstoneOperation, keyPair)
      } catch (error) {
        console.error("Failed to tombstone identity:", error)
      }
    })()
  }

  return <button type="button" onClick={ onClick }>Tombstone</button>
}

export default TombstoneButton
