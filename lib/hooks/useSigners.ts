import type { NameKey } from "@onamea/types"
import { useEffect, useState } from "react"
import type { ExtendedIdentityWithMessages } from "../background/state.ts"

const buildSigners = (identity: ExtendedIdentityWithMessages) => [
  {
    nameKey: identity.id,
    fingerprintedName: identity.fingerprintedName,
    isSubKey: false
  },
  ...identity.subKeys.map(({ subKey, fingerprintedName, domain }) => ({
    isSubKey: true,
    nameKey: subKey,
    fingerprintedName: fingerprintedName,
    subKeyDomain: domain
  }))
]

const domainMatchesOrigin = (domain: string | undefined, pageOrigin: string) => {
  if (domain === undefined || domain === "" || pageOrigin === "") {
    return false
  }

  try {
    const hostname = new URL(pageOrigin).hostname.toLowerCase()
    const normalizedDomain = domain.toLowerCase().replace(/\.$/, "")
    return hostname === normalizedDomain || hostname.endsWith(`.${ normalizedDomain }`)
  } catch (_error) {
    return false
  }
}

const getDefaultSigner = (identity: ExtendedIdentityWithMessages, pageOrigin: string) => {
  const subKeysWithDomain = identity.subKeys.filter(subKey => 
    subKey.domain !== undefined && subKey.domain !== "" && subKey.domain !== "*"
  )

  return subKeysWithDomain.find(({ domain }) => domainMatchesOrigin(domain, pageOrigin))?.subKey ?? 
    identity.subKeys.find(({ domain }) => domain === "*")?.subKey ?? 
    identity.subKeys.find(({ domain }) => domain === "" || domain === undefined)?.subKey ??
    identity.id
}

export const useSigners = (identity: ExtendedIdentityWithMessages, pageOrigin: string) => {

  const signers = buildSigners(identity)
  const initialSigner = getDefaultSigner(identity, pageOrigin)
  const [selectedSigner, setSelectedSigner] = useState<NameKey>(initialSigner)

  useEffect(() => {
    setSelectedSigner(getDefaultSigner(identity, pageOrigin))
  }, [identity, pageOrigin])

  return {
    signers,
    selectedSigner,
    setSelectedSigner
  }
}
