import type { KeyPairDisplay, NameKey } from "@onamea/types"
import { createRevokeOperation } from "@onamea/crdt"
import type { ExtendedIdentityWithMessages } from "../background/state.ts"
import useExtensionState from "../hooks/useExtensionState.ts"
import SubKeyDisplay from "./SubKeyDisplay.tsx"

type Props = {
  identity: ExtendedIdentityWithMessages
  keyPair: KeyPairDisplay
}

const IdentitySubKeysEdit = ({ identity, keyPair }: Props) => {

  const { signAndAppendOperation } = useExtensionState()

  const handleClick = async (subKey: NameKey) => {
    try {
      const grantOperation = identity.operations.find(operation => {
        return operation.type === "GRANT" && operation.subKey === subKey
      })
      if (grantOperation === undefined) {
        throw new Error ("No GRANT Operation found")
      }
      const revokeOperation = await createRevokeOperation(identity.id, grantOperation.hash)
      await signAndAppendOperation(revokeOperation, keyPair)
    } catch (error) {
      console.error("Failed to revoke subKey:", error)
    }
  }

  return (
    <ul>
      { identity.subKeys.map(subKey => (
        <li key={ subKey.subKey }>
          <SubKeyDisplay subKey={ subKey } />
          <button type="button" onClick={ () => handleClick(subKey.subKey) }>Revoke</button>
        </li>
      )) }
    </ul>
  )
}

export default IdentitySubKeysEdit
