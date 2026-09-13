import type { NameKey } from "@onamea/types"
import { type IdentityWithMessages, createRevokeOperation } from "@onamea/crdt"
import useExtensionState from "../hooks/useExtensionState.ts"
import SubKeyDisplay from "./SubKeyDisplay.tsx"

type Props = {
  identity: IdentityWithMessages
}

const IdentitySubKeysEdit = ({ identity }: Props) => {

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
      await signAndAppendOperation(revokeOperation, identity.id)
    } catch (error) {
      console.error("Failed to revoke subKey:", error)
    }
  }

  return (
    <ul>
      { identity.subKeys?.map(subKey => (
        <li key={ subKey.id }>
          <SubKeyDisplay subKey={ subKey } />
          <button type="button" onClick={ () => handleClick(subKey.id) }>Revoke</button>
        </li>
      )) }
    </ul>
  )
}

export default IdentitySubKeysEdit
