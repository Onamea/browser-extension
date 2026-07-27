import type { ContainerData } from "@/lib/container.ts"
import { checkStorage, set } from "@/lib/container/main.ts"
import { backgroundState, backgroundDispatch, setContainerExists, setData } from "@/lib/background/state.ts"
import { getPendingRequest, handleSign, handleConfirmSign, handleRejectSign } from "@/lib/background/signFlow.ts"

type SetDataMessage = {
  type: "SET_DATA"
  data: string
}

type WriteDataMessage = {
  type: "WRITE_DATA"
  data: ContainerData
  passphrase: string
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

type GetStateMessage = { type: "GET_STATE" }
type SetContainerExistsMessage = { type: "SET_CONTAINER_EXISTS", value: boolean | undefined }
type ClearDataMessage = { type: "CLEAR_DATA" }
type Message = SetDataMessage | WriteDataMessage | IdentifyMessage | SignMessage | GetPendingRequestMessage | ConfirmSignMessage | RejectSignMessage | GetStateMessage | SetContainerExistsMessage | ClearDataMessage

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

      case "GET_STATE": {
        if (backgroundState.containerExists === undefined) {
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
        sendResponse({ state: backgroundState })
        return false
      }

      case "SET_DATA": {
        setContainerExists(backgroundDispatch, true)
        setData(backgroundDispatch, message.data)
        broadcastState()
        sendResponse({ ok: true })
        return false
      }

      case "SET_CONTAINER_EXISTS": {
        setContainerExists(backgroundDispatch, message.value)
        broadcastState()
        sendResponse({ ok: true })
        return false
      }

      case "WRITE_DATA": {
        set(message.passphrase, JSON.stringify(message.data))
          .then(() => {
            setContainerExists(backgroundDispatch, true)
            setData(backgroundDispatch, JSON.stringify(message.data))
            broadcastState()
            sendResponse({ data: message.data })
          })
          .catch(error => sendResponse({ error: String(error) }))
        return true
      }

      case "CLEAR_DATA": {
        backgroundDispatch({ type: "CLEAR_DATA" })
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
