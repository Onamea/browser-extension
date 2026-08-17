import { checkStorage } from "@/lib/container/main.ts"
import { backgroundState, backgroundDispatch, setContainerStatus, setSessionData, setAccessKey, signOut } from "@/lib/background/state.ts"
import { getPendingRequest, handleSign, handleConfirmSign, handleRejectSign } from "@/lib/background/signFlow.ts"
import { shouldUseOffscreenMining, startMining } from "@/lib/background/mining.ts"
import {
  API_CONFIRM_SIGN,
  API_GET_PENDING_REQUEST,
  API_IDENTIFY,
  API_REJECT_SIGN,
  API_SIGN,
  type ApiMessage
} from "@/lib/messaging/api.ts"
import {
  MINING_ABORT,
  MINING_ERROR,
  MINING_OFFSCREEN_ABORT,
  MINING_OFFSCREEN_START,
  MINING_PROGRESS,
  MINING_RESULT,
  MINING_START,
  type MiningControlMessage,
  type MiningMessage
} from "@/lib/messaging/mining.ts"
import {
  STATE_CREATE_CONTAINER,
  STATE_INIT,
  STATE_SIGNIN,
  STATE_SIGNOUT,
  STATE_UPDATED,
  STATE_WRITE_DATA,
  type StateMessage
} from "@/lib/messaging/state.ts"
import type { SenderScopePolicy } from "@/lib/messaging/senderPolicy.ts"
import { isSenderAuthorized } from "@/lib/messaging/senderPolicy.ts"
import { isRuntimeMessage } from "@/lib/messaging/runtimeMessage.ts"

type ChromeOffscreenApi = {
  runtime: {
    getURL: (path: string) => string
    getContexts?: (filter: { contextTypes: string[], documentUrls: string[] }) => Promise<Array<unknown>>
  }
  offscreen?: {
    Reason: {
      DOM_PARSER: string
    }
    createDocument: (options: { url: string, reasons: string[], justification: string }) => Promise<void>
  }
}

type Message = StateMessage | ApiMessage | MiningControlMessage | MiningMessage

const OFFSCREEN_DOCUMENT_PATH = "/offscreen.html"
let activeMiningAbort: (() => void) | undefined
let activeMiningRequestId: string | undefined
const MESSAGE_SCOPE_POLICY: SenderScopePolicy = new Map([
  [API_SIGN, "web"],
  [API_IDENTIFY, "web"],
  [API_GET_PENDING_REQUEST, "extension"],
  [API_CONFIRM_SIGN, "extension"],
  [API_REJECT_SIGN, "extension"],
  [STATE_INIT, "extension"],
  [STATE_CREATE_CONTAINER, "extension"],
  [STATE_SIGNIN, "extension"],
  [STATE_WRITE_DATA, "extension"],
  [STATE_SIGNOUT, "extension"],
  [MINING_START, "extension"],
  [MINING_ABORT, "extension"],
  [MINING_PROGRESS, "extension"],
  [MINING_RESULT, "extension"],
  [MINING_ERROR, "extension"]
])

const hasOffscreenMiningDocument = async (chromeApi: ChromeOffscreenApi) => {
  const getContexts = chromeApi.runtime.getContexts?.bind(chromeApi.runtime)
  if (getContexts === undefined) {
    return false
  }

  const documentUrl = chromeApi.runtime.getURL(OFFSCREEN_DOCUMENT_PATH)
  const existing = await getContexts({
    contextTypes: ["OFFSCREEN_DOCUMENT"],
    documentUrls: [documentUrl]
  })
  return existing.length > 0
}

const ensureOffscreenMiningDocument = async () => {
  const chromeApi = (globalThis as typeof globalThis & { chrome?: ChromeOffscreenApi }).chrome
  if (chromeApi?.offscreen === undefined) {
    throw new Error("chrome.offscreen API is unavailable")
  }

  if (await hasOffscreenMiningDocument(chromeApi)) {
    return
  }

  try {
    await chromeApi.offscreen.createDocument({
      url: OFFSCREEN_DOCUMENT_PATH,
      reasons: [chromeApi.offscreen.Reason.DOM_PARSER],
      justification: "Run parallel mining workers in a document context"
    })
  } catch (error) {
    if (await hasOffscreenMiningDocument(chromeApi)) {
      return
    }
    throw error
  }
}

const broadcastState = () => {
  browser.runtime.sendMessage({ type: STATE_UPDATED, state: backgroundState })
}

const stopActiveMining = () => {
  activeMiningAbort?.()
  activeMiningAbort = undefined
  activeMiningRequestId = undefined
}

const openSignRequestUi = async () => {
  try {
    await browser.action.openPopup()
  } catch {
    // Firefox can reject programmatic popup opening when there is no direct user gesture.
  }
}

export default defineBackground(() => {
  browser.runtime.onMessage.addListener((message: Message, sender: { tab?: unknown, url?: string }, sendResponse: (response: unknown) => void) => {
    if (isRuntimeMessage(message) === false) {
      sendResponse({ error: "Invalid message" })
      return false
    }

    // centralized message authorization policy by sender scope
    const extensionBaseUrl = browser.runtime.getURL("")
    if (isSenderAuthorized(message.type, sender.url, extensionBaseUrl, MESSAGE_SCOPE_POLICY) === false) {
      sendResponse({ error: "Forbidden" })
      return false
    }

    // messages logic
    switch (message.type) {

      case STATE_INIT: {
        if (backgroundState.isInitialized) {
          sendResponse({ state: backgroundState })
          return false
        }

        checkStorage()
          .then(exists => {
            setContainerStatus(backgroundDispatch, exists)
            sendResponse({ state: backgroundState })
          })
          .catch(() => {
            setContainerStatus(backgroundDispatch, false)
            sendResponse({ state: backgroundState })
          })
        return true
      }

      case STATE_CREATE_CONTAINER: {
        setContainerStatus(backgroundDispatch, true)
        setSessionData(backgroundDispatch, "")
        setAccessKey(backgroundDispatch, message.accessKey)
        broadcastState()
        sendResponse({ ok: true })
        return false
      }

      case STATE_SIGNIN: {
        setContainerStatus(backgroundDispatch, true)
        setSessionData(backgroundDispatch, message.raw)
        setAccessKey(backgroundDispatch, message.accessKey)
        broadcastState()
        sendResponse({ ok: true })
        return false
      }

      case STATE_WRITE_DATA: {
        setContainerStatus(backgroundDispatch, true)
        setSessionData(backgroundDispatch, message.raw)
        setAccessKey(backgroundDispatch, message.accessKey)
        broadcastState()
        sendResponse({ ok: true })
        return false
      }

      case STATE_SIGNOUT: {
        signOut(backgroundDispatch)
        broadcastState()
        sendResponse({ ok: true })
        return false
      }

      case MINING_START: {
        if (shouldUseOffscreenMining()) {
          void (async () => {
            try {
              await ensureOffscreenMiningDocument()

              // createDocument resolves before the module script loads and registers its
              // onMessage listener, so retry until the offscreen document responds.
              let startResponse: { ok?: boolean, error?: string } | undefined
              for (let attempt = 0; attempt < 10; attempt++) {
                try {
                  startResponse = await browser.runtime.sendMessage({
                    type: MINING_OFFSCREEN_START,
                    requestId: message.requestId,
                    name: message.name,
                    fingerprintDisplay: message.fingerprintDisplay,
                    shouldGenerateMnemonic: message.shouldGenerateMnemonic
                  }) as { ok?: boolean, error?: string }
                  if (startResponse?.ok === true || startResponse?.error !== undefined) {
                    break
                  }
                } catch {
                  // listener not ready yet
                }
                await new Promise<void>(r => setTimeout(r, 50))
              }

              if (startResponse?.ok !== true) {
                sendResponse({ error: startResponse?.error ?? "Offscreen document did not respond" })
                return
              }

              sendResponse({ ok: true })
            } catch (error) {
              sendResponse({ error: String(error) })
            }
          })()
          return true
        }

        void (() => {
          void (() => {
            try {
              stopActiveMining()
              activeMiningRequestId = message.requestId
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

                  void browser.runtime.sendMessage({
                    type: MINING_PROGRESS,
                    requestId: message.requestId,
                    totalAttempts
                  })
                },
                onResult: result => {
                  if (activeMiningRequestId !== message.requestId) {
                    return
                  }

                  void browser.runtime.sendMessage({
                    type: MINING_RESULT,
                    requestId: message.requestId,
                    result
                  })
                },
                onError: error => {
                  if (activeMiningRequestId !== message.requestId) {
                    return
                  }

                  void browser.runtime.sendMessage({
                    type: MINING_ERROR,
                    requestId: message.requestId,
                    error
                  })
                },
                onComplete: () => {
                  if (activeMiningRequestId !== message.requestId) {
                    return
                  }

                  activeMiningAbort = undefined
                  activeMiningRequestId = undefined
                }
              }
            )

              activeMiningAbort = abort
              sendResponse({ ok: true })
            } catch (error) {
              sendResponse({ error: String(error) })
            }
          })()
        })()
        return true
      }

      case MINING_ABORT: {
        if (shouldUseOffscreenMining()) {
          void browser.runtime.sendMessage({ type: MINING_OFFSCREEN_ABORT, requestId: message.requestId })
        } else if (message.requestId === undefined || message.requestId === activeMiningRequestId) {
          stopActiveMining()
        }
        sendResponse({ ok: true })
        return false
      }

      case API_IDENTIFY: {
        if (backgroundState.data === undefined) {
          sendResponse({ error: "Not initialized" })
          return false
        }
        sendResponse({ nameKey: backgroundState.data.nameKey })
        return false
      }

      case API_GET_PENDING_REQUEST: {
        const buildResponse = () => ({
          pendingRequest: getPendingRequest(),
          data: backgroundState.data
        })
        sendResponse(buildResponse())
        return false
      }

      case API_SIGN: {
        const { data, requestId } = message
        const origin = sender.url ?? ""
        return handleSign(data, requestId, origin, sendResponse, () => void openSignRequestUi())
      }

      case API_CONFIRM_SIGN: {
        return handleConfirmSign(backgroundState, sendResponse)
      }

      case API_REJECT_SIGN: {
        return handleRejectSign(sendResponse)
      }

      // offscreen documents cannot send messages directly to extension pages in MV3
      case MINING_PROGRESS:
      case MINING_RESULT:
      case MINING_ERROR: {
        void browser.runtime.sendMessage(message)
        sendResponse({ ok: true })
        return false
      }
    }
  })
})
