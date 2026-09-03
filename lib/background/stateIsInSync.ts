import type { ExtensionState } from "./state.ts"
import { getIdentityFromMessages } from "../storage/identityMessagesStorage.ts"

export const stateIsInSync = async (state: ExtensionState): Promise<boolean> => {
  if (state.isInitialized === false) {
    throw new Error("State is not initialized")
  }
  if (state.container.hasContainer === false) {
    throw new Error("No Container")
  }
  if (state.container.isUnlocked === false) {
    throw new Error("Container is locked")
  }
  if (state.container.data === undefined) {
    throw new Error("No Container Data")
  }
  const { identity } = state.container.data
  const buildIdentity = await getIdentityFromMessages(state.local.messages)
  if (buildIdentity === undefined) return false
  if (buildIdentity.id !== identity.nameKey) return false
  for (const subKey of buildIdentity.subKeys) {
    const found = state.container.data?.subKeys.find(({ nameKey }) => nameKey === subKey.subKey)
    if (found === undefined) return false
  }

  return true
}
