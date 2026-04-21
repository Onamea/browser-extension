import type { KeyPair } from "@vanice/types"
import { type Operation, type Message, signOperation } from "@vanice/crdt"

export const sign = async (operation: Operation, keyPair: KeyPair): Promise<Message> => {
  return await signOperation(operation, keyPair)
}
