import {
  MINING_ERROR,
  MINING_OFFSCREEN_ABORT,
  MINING_OFFSCREEN_START,
  MINING_PROGRESS,
  MINING_RESULT,
  type OffscreenAbortMiningMessage,
  type OffscreenStartMiningMessage,
  type OffscreenMiningControlMessage
} from "@/lib/messaging/mining.ts"
import { startMining } from "@/lib/background/mining.ts"
import type { SenderScopePolicy } from "@/lib/messaging/senderPolicy.ts"
import { isSenderAuthorized } from "@/lib/messaging/senderPolicy.ts"
import { isRuntimeMessage } from "@/lib/messaging/runtimeMessage.ts"

type RequestId = string

type Message = OffscreenMiningControlMessage | OffscreenStartMiningMessage | OffscreenAbortMiningMessage

const OFFSCREEN_MESSAGE_SCOPE_POLICY: SenderScopePolicy = new Map([
  [MINING_OFFSCREEN_START, "extension"],
  [MINING_OFFSCREEN_ABORT, "extension"]
])

let activeMiningAbort: (() => void) | undefined
let activeMiningRequestId: RequestId | undefined
let activeMiningTimeout: ReturnType<typeof setTimeout> | undefined

const clearActiveMiningTimeout = () => {
  if (activeMiningTimeout !== undefined) {
    clearTimeout(activeMiningTimeout)
  }
  activeMiningTimeout = undefined
}

const stopActiveMining = () => {
  clearActiveMiningTimeout()
  activeMiningAbort?.()
  activeMiningAbort = undefined
  activeMiningRequestId = undefined
}

browser.runtime.onMessage.addListener((message: Message, sender, sendResponse) => {
  if (isRuntimeMessage(message) === false) {
    sendResponse({ error: "Invalid message" })
    return false
  }

  const extensionBaseUrl = browser.runtime.getURL("")
  if (OFFSCREEN_MESSAGE_SCOPE_POLICY.has(message.type) === false) {
    return false
  }

  if (isSenderAuthorized(message.type, sender.url, extensionBaseUrl, OFFSCREEN_MESSAGE_SCOPE_POLICY) === false) {
    sendResponse({ error: "Forbidden" })
    return false
  }

  switch (message.type) {
    case MINING_OFFSCREEN_START: {
      stopActiveMining()
      activeMiningRequestId = message.requestId

      try {
        const { abort } = startMining(
          {
            name: message.name,
            fingerprintDisplay: message.fingerprintDisplay,
            shouldGenerateMnemonic: message.shouldGenerateMnemonic
          },
          {
            onProgress: totalAttempts => {
              if (activeMiningRequestId !== message.requestId) {
                return
              }

              browser.runtime.sendMessage({
                type: MINING_PROGRESS,
                requestId: message.requestId,
                totalAttempts
              })
            },
            onResult: result => {
              if (activeMiningRequestId !== message.requestId) {
                return
              }

              browser.runtime.sendMessage({
                type: MINING_RESULT,
                requestId: message.requestId,
                result
              })
            },
            onError: error => {
              if (activeMiningRequestId !== message.requestId) {
                return
              }

              browser.runtime.sendMessage({
                type: MINING_ERROR,
                requestId: message.requestId,
                error
              })
            },
            onComplete: () => {
              if (activeMiningRequestId !== message.requestId) {
                return
              }

              clearActiveMiningTimeout()
              activeMiningAbort = undefined
              activeMiningRequestId = undefined
            }
          }
        )

        activeMiningAbort = abort
        sendResponse({ ok: true })
        return false
      } catch (error) {
        stopActiveMining()
        sendResponse({ error: String(error) })
        return false
      }
    }

    case MINING_OFFSCREEN_ABORT: {
      if (message.requestId === undefined || message.requestId === activeMiningRequestId) {
        stopActiveMining()
      }
      sendResponse({ ok: true })
      return false
    }
  }
})
