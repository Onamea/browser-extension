import type { FingerprintedName, NameKey } from "@onamea/types"
import type { IdentityWithMessages, SubKeyDomain } from "@onamea/crdt"
import { useEffect, useState } from "react"

export type Signer = {
  id: NameKey
  isSubKey: boolean
  displayName: FingerprintedName | string
  subKeyDomain?: SubKeyDomain
}

const buildSigners = (identity: IdentityWithMessages): Signer[] => [
  {
    id: identity.id,
    displayName: identity.displayName ?? identity.id,
    isSubKey: false
  },
  ...identity.subKeys?.map(({ id, displayName, domain }) => ({
    id,
    displayName: displayName ?? id,
    subKeyDomain: domain,
    isSubKey: true
  })) ?? []
]

const domainMatchesOrigin = (domain: string | undefined, pageOrigin: string): boolean => {
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

const getDefaultSigner = (identity: IdentityWithMessages, pageOrigin: string): NameKey => {
  const subKeysWithDomain = identity.subKeys?.filter(subKey => 
    subKey.domain !== undefined && subKey.domain !== "" && subKey.domain !== "*"
  ) ?? []

  return subKeysWithDomain.find(({ domain }) => domainMatchesOrigin(domain, pageOrigin))?.id ?? 
    identity.subKeys?.find(({ domain }) => domain === "*")?.id ?? 
    identity.subKeys?.find(({ domain }) => domain === "" || domain === undefined)?.id ??
    identity.id
}

export const useSigners = (identity: IdentityWithMessages, pageOrigin: string) => {

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
