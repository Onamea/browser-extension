import type { FingerprintDisplay, Name } from "@onamea/types"
import type {
  MiningErrorMessage,
  MiningMessage,
  MiningProgressMessage,
  MiningResultMessage
} from "@/lib/messaging/mining.ts"
import {
  MINING_ABORT,
  MINING_ERROR,
  MINING_PROGRESS,
  MINING_RESULT,
  MINING_START,
  isMiningErrorMessage,
  isMiningProgressMessage,
  isMiningResultMessage
} from "@/lib/messaging/mining.ts"
import { sendRuntimeMessage, subscribeRuntimeMessages } from "@/lib/messaging/client/runtime.ts"

type StartMiningResponse = {
  ok?: boolean
  error?: string
}

export type MiningMessageListener = (message: MiningMessage) => void

export const startMining = async (
  name: Name,
  fingerprintDisplay?: FingerprintDisplay,
  shouldGenerateMnemonic = false
): Promise<string> => {
  const requestId = crypto.randomUUID()
  const response = await sendRuntimeMessage<StartMiningResponse>({
    type: MINING_START,
    requestId,
    name,
    fingerprintDisplay,
    shouldGenerateMnemonic
  })

  if (response?.error !== undefined) {
    throw new Error(response.error)
  }

  return requestId
}

export const abortMining = async (requestId?: string): Promise<void> => {
  await sendRuntimeMessage({ type: MINING_ABORT, requestId })
}

export const onMiningMessage = (requestId: string, listener: MiningMessageListener) => {
  return subscribeRuntimeMessages(message => {
    if (isMiningProgressMessage(message)) {
      if (message.requestId === requestId) {
        listener(message)
      }
      return
    }

    if (isMiningErrorMessage(message)) {
      if (message.requestId === requestId) {
        listener(message)
      }
      return
    }

    if (isMiningResultMessage(message) && message.requestId === requestId) {
      listener(message)
    }
  })
}

export const isMiningProgress = (message: MiningMessage): message is MiningProgressMessage => {
  return message.type === MINING_PROGRESS
}

export const isMiningError = (message: MiningMessage): message is MiningErrorMessage => {
  return message.type === MINING_ERROR
}

export const isMiningResult = (message: MiningMessage): message is MiningResultMessage => {
  return message.type === MINING_RESULT
}
