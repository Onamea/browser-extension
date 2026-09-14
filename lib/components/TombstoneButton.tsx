import { useState } from "react"
import type { IdentityWithMessages } from "@onamea/crdt"
import useExtensionState from "../hooks/useExtensionState.ts"
import ErrorDisplay from "./ErrorDisplay.tsx"

type Props = {
  identity: IdentityWithMessages
}

const TombstoneButton = ({ identity }: Props) => {

  const { createSignAndAppendOperation } = useExtensionState()
  const [error, setError] = useState<string>()

  const onClick = () => {

    const confirmed = globalThis.confirm(`Are you sure you want to tombstone Identity: ${ identity.id }?`)
    if (confirmed === false) return

    setError(undefined)

    void (async () => {
      const message = await createSignAndAppendOperation(identity, "DELETE")
      if (message === undefined) {
        setError("Failed to tombstone identity")
      }
    })()
  }

  return (
    <>
      { error !== undefined && <ErrorDisplay errors={ error } /> }
      <button type="button" onClick={ onClick }>Tombstone</button>
    </>
  )
}

export default TombstoneButton
