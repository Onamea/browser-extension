export type SenderScope = "extension" | "web"

export type SenderScopePolicy = ReadonlyMap<string, SenderScope>

export const getSenderScope = (senderUrl: string | undefined, extensionBaseUrl: string): SenderScope => {
  if (senderUrl !== undefined && senderUrl.startsWith(extensionBaseUrl) === false) {
    return "web"
  }

  return "extension"
}

export const isSenderAuthorized = (
  messageType: string,
  senderUrl: string | undefined,
  extensionBaseUrl: string,
  policy: SenderScopePolicy
): boolean => {
  const requiredScope = policy.get(messageType)
  if (requiredScope === undefined) {
    return false
  }

  return getSenderScope(senderUrl, extensionBaseUrl) === requiredScope
}
