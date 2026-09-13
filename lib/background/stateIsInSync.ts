import type { ExtensionState } from "./state.ts"
import { isCreateOperation } from "@onamea/crdt"
import { getIdentityFromMessages } from "../storage/identityMessagesStorage.ts"
import { findEntryInContainerData } from "../types/ContainerData.ts"

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
  const buildIdentity = await getIdentityFromMessages(state.local.messages)
  if (buildIdentity === undefined) return false
  const createOperation = buildIdentity.operations.find(isCreateOperation)
  if (createOperation === undefined || createOperation.id !== buildIdentity.id) return false
  const identityEntry = findEntryInContainerData(state.container.data, buildIdentity.id)
  if (identityEntry === undefined) return false
  if (buildIdentity.subKeys !== undefined) {
    for (const subKey of buildIdentity.subKeys) {
      const found = findEntryInContainerData(state.container.data, subKey.id)
      if (found === undefined) return false
    }
  }

  return true
}
