import { type SlotData, writeSlot } from "@/lib/pdec.ts"
import { type SlotDataState, getSlot, setSlot } from "@/lib/background/state.ts"
import { getPendingRequest, handleSign, handleConfirmSign, handleRejectSign } from "@/lib/background/signFlow.ts"

type SetSlotMessage = {
  type: "SET_SLOT"
  slot: SlotData
}

type WriteSlotMessage = {
  type: "WRITE_SLOT"
  data: SlotDataState
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

type Message = SetSlotMessage | WriteSlotMessage | IdentifyMessage | SignMessage | GetPendingRequestMessage | ConfirmSignMessage | RejectSignMessage

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
      case "SET_SLOT": {
        setSlot(message.slot)
        sendResponse({ ok: true })
        return false
      }

      case "WRITE_SLOT": {
        console.log(message.data, JSON.stringify(message.data))
        writeSlot(message.passphrase, JSON.stringify(message.data))
          .then(slot => {
            setSlot(slot)
            sendResponse({ slot })
          })
          .catch(error => sendResponse({ error: String(error) }))
        return true
      }

      case "IDENTIFY": {
        const slot = getSlot()
        if (slot?.slotData === undefined) {
          sendResponse({ error: "Not initialized" })
          return false
        }
        sendResponse({ nameKey: slot.slotData.nameKey })
        return false
      }

      case "GET_PENDING_REQUEST": {
        const buildResponse = () => ({
          pendingRequest: getPendingRequest(),
          slot: getSlot()?.slot
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
        return handleConfirmSign(getSlot(), sendResponse)
      }
      case "REJECT_SIGN": {
        return handleRejectSign(sendResponse)
      }
    }
  })
})

