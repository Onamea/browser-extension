import type { SlotData } from "@mikeobank/pdec"
import type { KeyPairAsJSON } from "@vanice/types"
import { openContainer, writeSlot } from "@/lib/pdec.ts"
import { getContainerExists, setContainerExists, getUnlocked, setUnlocked } from "@/lib/background/state.ts"
import { getPendingRequest, handleSign, handleConfirmSign, handleRejectSign } from "@/lib/background/signFlow.ts"

type SetContainerExistsMessage = {
  type: "SET_CONTAINER_EXISTS"
}

type UnlockMessage = {
  type: "UNLOCK"
  slotData: SlotData
  keyPair: KeyPairAsJSON
  passphrase: string
}

type WriteSlotMessage = {
  type: "WRITE_SLOT"
  data: string
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

type Message = UnlockMessage | SetContainerExistsMessage | WriteSlotMessage | SignMessage | GetPendingRequestMessage | ConfirmSignMessage | RejectSignMessage

export default defineBackground(() => {
  browser.runtime.onMessage.addListener((message: Message, sender: { tab?: unknown, url?: string }, sendResponse: (response: unknown) => void) => {

    // guard
    // sender.tab is only defined for messages from content scripts, and must be undefined for messages from the extension's own pages (popup, options, background) to prevent spoofing
    switch (message.type) {
      case "SIGN": {
        if (sender.tab === undefined) {
          sendResponse({ error: "Forbidden" })
          return false
        }
        break
      }
      default: {
        if (sender.tab !== undefined) {
          sendResponse({ error: "Forbidden" })
          return false
        }
      }
    }

    // messages logic
    switch (message.type) {
      case "SET_CONTAINER_EXISTS": {
        setContainerExists(true)
        sendResponse({ ok: true })
        return false
      }
      case "UNLOCK": {
        setUnlocked({ slotData: message.slotData, keyPair: message.keyPair, passphrase: message.passphrase })
        sendResponse({ ok: true })
        return false
      }
      case "WRITE_SLOT": {
        const unlocked = getUnlocked()
        if (unlocked === undefined) {
          sendResponse({ error: "Not unlocked" })
          return false
        }
        writeSlot(unlocked.passphrase, message.data)
          .then(slotData => {
            setUnlocked({ ...unlocked, slotData })
            sendResponse({ slotData })
          })
          .catch(error => sendResponse({ error: String(error) }))
        return true
      }
      case "GET_PENDING_REQUEST": {
        const buildResponse = () => ({
          pendingRequest: getPendingRequest() ?? null,
          unlocked: getUnlocked() !== undefined,
          containerExists: getContainerExists(),
          slotData: getUnlocked()?.slotData ?? null
        })
        if (getContainerExists() === false) {
          openContainer().then(exists => {
            setContainerExists(exists)
            sendResponse(buildResponse())
          })
          return true
        }
        sendResponse(buildResponse())
        return false
      }
      case "SIGN": {
        const { data, requestId } = message
        const origin = sender.url ?? ""
        return handleSign(data, requestId, origin, sendResponse, () => browser.action.openPopup().catch(() => {}))
      }
      case "CONFIRM_SIGN": {
        return handleConfirmSign(getUnlocked(), sendResponse)
      }
      case "REJECT_SIGN": {
        return handleRejectSign(sendResponse)
      }
    }
  })
})

