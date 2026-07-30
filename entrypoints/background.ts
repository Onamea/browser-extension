import { checkStorage } from "@/lib/container/main.ts"
import { backgroundState, backgroundDispatch, setContainerExists, setData, setAccessKey } from "@/lib/background/state.ts"
import { getPendingRequest, handleSign, handleConfirmSign, handleRejectSign } from "@/lib/background/signFlow.ts"

type InitializeMessage = {
  type: "INITIALIZE"
}

type CreateContainerMessage = {
  type: "CREATE_CONTAINER"
  accessKey: string
}

type SigninMessage = {
  type: "SIGNIN"
  raw: string
  accessKey: string
}

type WriteDataMessage = {
  type: "WRITE_DATA"
  raw: string
  accessKey: string
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

type Message = InitializeMessage | CreateContainerMessage | SigninMessage | WriteDataMessage | SignoutMessage | IdentifyMessage | SignMessage | GetPendingRequestMessage | ConfirmSignMessage | RejectSignMessage

const broadcastState = () => {
  browser.runtime.sendMessage({ type: "STATE_UPDATED", state: backgroundState })
}

export default defineBackground(() => {
  browser.runtime.onMessage.addListener((message: Message, sender: { tab?: unknown, url?: string }, sendResponse: (response: unknown) => void) => {

    // guard
    // SIGN must originate from a content script (sender.tab defined, url not from extension)
    // all other messages must originate from extension pages (url starts with extension base url)
    const isFromExtension = sender.url?.startsWith(browser.runtime.getURL("")) === true
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
    }
  })
})
