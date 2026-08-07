import { createWorkerPool } from "@vanice/vanice-pool"
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

type RequestId = string

type Message = OffscreenMiningControlMessage | OffscreenStartMiningMessage | OffscreenAbortMiningMessage

const MAX_MINING_DURATION_MS = 30_000
const NUM_WORKERS = 8 
const WORKER_PROGRESS_INTERVAL_MS = 500

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
  const isFromExtension = sender.url === undefined || sender.url?.startsWith(browser.runtime.getURL("")) === true
  if (isFromExtension === false) {
    sendResponse({ error: "Forbidden" })
    return false
  }

  switch (message.type) {
    case MINING_OFFSCREEN_START: {
      stopActiveMining()
      const miningWorkerUrl = new URL(browser.runtime.getURL("/workers/worker.js"))
      activeMiningRequestId = message.requestId

      try {
        const { promise, abort } = createWorkerPool(
          "Ed25519",
          message.name,
          message.fingerprintDisplay,
          NUM_WORKERS,
          miningWorkerUrl,
          ({ totalAttempts }) => {
            if (activeMiningRequestId !== message.requestId) {
              return
            }
            browser.runtime.sendMessage({
              type: MINING_PROGRESS,
              requestId: message.requestId,
              totalAttempts
            })
          },
          1000,
          false,
          undefined,
          undefined,
          WORKER_PROGRESS_INTERVAL_MS
        )

        activeMiningAbort = abort
        activeMiningTimeout = setTimeout(() => {
          if (activeMiningRequestId !== message.requestId) {
            return
          }
          activeMiningAbort?.()
        }, MAX_MINING_DURATION_MS)

        void promise
          .then(result => {
            if (activeMiningRequestId !== message.requestId) {
              return
            }
            if (result === undefined || result.privateKey === undefined || result.privateKeyDisplay === undefined) {
              browser.runtime.sendMessage({
                type: MINING_ERROR,
                requestId: message.requestId,
                error: "Mining timed out. Try a shorter name."
              })
              return
            }
            browser.runtime.sendMessage({
              type: MINING_RESULT,
              requestId: message.requestId,
              result
            })
          })
          .catch(error => {
            if (activeMiningRequestId !== message.requestId) {
              return
            }
            browser.runtime.sendMessage({
              type: MINING_ERROR,
              requestId: message.requestId,
              error: String(error)
            })
          })
          .finally(() => {
            if (activeMiningRequestId === message.requestId) {
              clearActiveMiningTimeout()
              activeMiningAbort = undefined
              activeMiningRequestId = undefined
            }
          })

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
