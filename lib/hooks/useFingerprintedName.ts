import { primaryKeyToFingerprintedName, type FingerprintedName } from "@onamea/types"
import type { IdentityWithMessages } from "@onamea/crdt"
import { useEffect, useState } from "react"

const useFingerprintedName = (identity: IdentityWithMessages | undefined): FingerprintedName | undefined => {
  const [fingerprintedName, setFingerprintedName] = useState<FingerprintedName>()

  useEffect(() => {
    if (identity === undefined) {
      setFingerprintedName(undefined)
      return
    }

    void (async () => {
      const [nextFingerprintedName] = await primaryKeyToFingerprintedName(identity.primaryKey, identity.name)
      setFingerprintedName(nextFingerprintedName)
    })()
  }, [identity])

  return fingerprintedName
}

export default useFingerprintedName
