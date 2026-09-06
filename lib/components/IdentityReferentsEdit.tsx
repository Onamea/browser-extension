import type { KeyPairDisplay, NameKey } from "@onamea/types"
import { createDenounceOperation } from "@onamea/crdt"
import type { ExtendedIdentityWithMessages } from "../background/state.ts"
import useExtensionState from "../hooks/useExtensionState.ts"

type Props = {
  identity: ExtendedIdentityWithMessages
  keyPair: KeyPairDisplay
}

const IdentityReferentsEdit = ({ identity, keyPair }: Props) => {

  const { signAndAppendOperation } = useExtensionState()

  const handleClick = async (referent: NameKey) => {
    try {
      const vouchOperation = identity.operations.find(operation => {
        return operation.type === "VOUCH" && operation.referent === referent
      })
      if (vouchOperation === undefined) {
        throw new Error("No VOUCH Operation found")
      }
      const denounceOperation = await createDenounceOperation(identity.id, vouchOperation.hash)
      await signAndAppendOperation(denounceOperation, keyPair)
    } catch (error) {
      console.error("Failed to denounce referent:", error)
    }
  }

  return (
    <ul>
      { identity.referents.map(({ id, fingerprintedName }) => (
        <li key={ id }>
          { fingerprintedName }
          <button type="button" onClick={ () => handleClick(id) }>Denounce</button>
        </li>
      )) }
    </ul>
  )

}

export default IdentityReferentsEdit
