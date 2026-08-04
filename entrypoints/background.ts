import { type AccessKey, checkStorage } from "@/lib/container/main.ts"
import { backgroundState, backgroundDispatch, setContainerExists, setData, setAccessKey } from "@/lib/background/state.ts"
import { getPendingRequest, handleSign, handleConfirmSign, handleRejectSign } from "@/lib/background/signFlow.ts"
import type { FingerprintDisplay, Name } from "@vanice/types"

type InitializeMessage = {
  type: "INITIALIZE"
}

type CreateContainerMessage = {
  type: "CREATE_CONTAINER"
  accessKey: AccessKey
}

type SigninMessage = {
  type: "SIGNIN"
  raw: string
  accessKey: AccessKey
}

type WriteDataMessage = {
  type: "WRITE_DATA"
  raw: string
  accessKey: AccessKey
}

type SignoutMessage = {
  type: "SIGNOUT"
}

type IdentifyMessage = {
  type: "IDENTIFY"
}

type SignMessage = {
  type: "SIGN"
  data: unknown
  requestId: string
}

type GetPendingRequestMessage = {
  type: "GET_PENDING_REQUEST"
}

type ConfirmSignMessage = {
  type: "CONFIRM_SIGN"
}

type RejectSignMessage = {
  type: "REJECT_SIGN"
}

type StartMiningMessage = {
  type: "START_MINING"
  requestId: string
  name: Name
  fingerprintDisplay?: FingerprintDisplay
}

type AbortMiningMessage = {
  type: "ABORT_MINING"
  requestId?: string
}

type MiningProgressMessage = {
  type: "MINING_PROGRESS"
  requestId: string
  totalAttempts: number
}

type MiningResultMessage = {
  type: "MINING_RESULT"
  requestId: string
  result: unknown
}

type MiningErrorMessage = {
  type: "MINING_ERROR"
  requestId: string
  error: string
}

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

type Message = InitializeMessage | CreateContainerMessage | SigninMessage | WriteDataMessage | SignoutMessage | IdentifyMessage | SignMessage | GetPendingRequestMessage | ConfirmSignMessage | RejectSignMessage | StartMiningMessage | AbortMiningMessage | MiningProgressMessage | MiningResultMessage | MiningErrorMessage

const OFFSCREEN_DOCUMENT_PATH = "/offscreen.html"
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
  browser.runtime.sendMessage({ type: "STATE_UPDATED", state: backgroundState })
}

export default defineBackground(() => {
  browser.runtime.onMessage.addListener((message: Message, sender: { tab?: unknown, url?: string }, sendResponse: (response: unknown) => void) => {

    // guard
    // SIGN must originate from a content script (sender.tab defined, url not from extension)
    // all other messages must originate from extension pages (url starts with extension base url)
    const isFromExtension = sender.url === undefined || sender.url?.startsWith(browser.runtime.getURL("")) === true
    switch (message.type) {
      case "SIGN": 
      case "IDENTIFY": {
        if (sender.tab === undefined || isFromExtension) {
          sendResponse({ error: "Forbidden" })
          return false
        }
        break
      }
      default: {
        if (isFromExtension === false) {
          sendResponse({ error: "Forbidden" })
          return false
        }
      }
    }

    // messages logic
    switch (message.type) {

      case "INITIALIZE": {
        if (backgroundState.isInitialized) {
          sendResponse({ state: backgroundState })
          return false
        }

        checkStorage()
          .then(exists => {
            setContainerExists(backgroundDispatch, exists)
            sendResponse({ state: backgroundState })
          })
          .catch(() => {
            setContainerExists(backgroundDispatch, false)
            sendResponse({ state: backgroundState })
          })
        return true
      }

      case "CREATE_CONTAINER": {
        setContainerExists(backgroundDispatch, true)
        setData(backgroundDispatch, "")
        setAccessKey(backgroundDispatch, message.accessKey)
        broadcastState()
        sendResponse({ ok: true })
        return false
      }

      case "SIGNIN": {
        setContainerExists(backgroundDispatch, true)
        setData(backgroundDispatch, message.raw)
        setAccessKey(backgroundDispatch, message.accessKey)
        broadcastState()
        sendResponse({ ok: true })
        return false
      }

      case "WRITE_DATA": {
        setContainerExists(backgroundDispatch, true)
        setData(backgroundDispatch, message.raw)
        setAccessKey(backgroundDispatch, message.accessKey)
        broadcastState()
        sendResponse({ ok: true })
        return false
      }

      case "SIGNOUT": {
        backgroundDispatch({ type: "SIGNOUT" })
        broadcastState()
        sendResponse({ ok: true })
        return false
      }

      case "START_MINING": {
        void (async () => {
          try {
            await ensureOffscreenMiningDocument()

            // createDocument resolves before the module script loads and registers its
            // onMessage listener, so retry until the offscreen document responds.
            let startResponse: { ok?: boolean, error?: string } | undefined
            for (let attempt = 0; attempt < 10; attempt++) {
              try {
                startResponse = await browser.runtime.sendMessage({
                  type: "OFFSCREEN_START_MINING",
                  requestId: message.requestId,
                  name: message.name,
                  fingerprintDisplay: message.fingerprintDisplay
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

      case "ABORT_MINING": {
        void browser.runtime.sendMessage({ type: "OFFSCREEN_ABORT_MINING", requestId: message.requestId })
        sendResponse({ ok: true })
        return false
      }

      case "IDENTIFY": {
        if (backgroundState.data === undefined) {
          sendResponse({ error: "Not initialized" })
          return false
        }
        sendResponse({ nameKey: backgroundState.data.nameKey })
        return false
      }

      case "GET_PENDING_REQUEST": {
        const buildResponse = () => ({
          pendingRequest: getPendingRequest(),
          data: backgroundState.data
        })
        sendResponse(buildResponse())
        return false
      }

      case "SIGN": {
        const { data, requestId } = message
        const origin = sender.url ?? ""
        return handleSign(data, requestId, origin, sendResponse, () => browser.action.openPopup().catch(() => {}))
      }

      case "CONFIRM_SIGN": {
        return handleConfirmSign(backgroundState, sendResponse)
      }

      case "REJECT_SIGN": {
        return handleRejectSign(sendResponse)
      }

      // offscreen documents cannot send messages directly to extension pages in MV3
      case "MINING_PROGRESS":
      case "MINING_RESULT":
      case "MINING_ERROR": {
        void browser.runtime.sendMessage(message)
        sendResponse({ ok: true })
        return false
      }
    }
  })
})
