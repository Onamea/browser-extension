import type { Identity, Message } from "@onamea/crdt"
import { isRootOperation, parseRawOperation } from "@onamea/crdt"

export const isRootOperationMessage = async (id: Identity["id"], message: Message): Promise<boolean> => {
  const operation = await parseRawOperation(message.raw)
  return isRootOperation(id, operation)
}
