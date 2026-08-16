import { validateOperation } from "@onamea/crdt"
import { API_IDENTIFY, API_SIGN, sendApiMessage } from "@/lib/messaging/api.ts"
import {
  type BridgeResponseMessage,
  BRIDGE_IDENTIFY_REQUEST,
  BRIDGE_IDENTIFY_RESPONSE,
  BRIDGE_SIGN_REQUEST,
  BRIDGE_SIGN_RESPONSE,
  buildBridgeErrorResponse,
  buildBridgeMessage,
  isBridgeRequestMessage,
  isSamePageHttpOrigin,
  toErrorMessage
} from "@/lib/messaging/bridge.ts"

export default defineContentScript({
  matches: ["<all_urls>"],
  main: () => {
    const postBridgeResponse = (message: BridgeResponseMessage, origin: string) => {
      const targetOrigin = origin === globalThis.location.origin ? origin : "*"
      globalThis.postMessage(message, targetOrigin)
    }

    const postBridgeError = (requestId: string, requestType: string, code: string, message: string, origin: string) => {
      postBridgeResponse(buildBridgeErrorResponse(requestId, requestType, code, message), origin)
    }

    globalThis.addEventListener("message", async event => {
      if (isSamePageHttpOrigin(event.origin, globalThis.location.origin) === false) return
      if (isBridgeRequestMessage(event.data) === false) return

      switch (event.data.type) {
        case BRIDGE_IDENTIFY_REQUEST: {
          const { requestId } = event.data
          try {
            const response = await sendApiMessage({ type: API_IDENTIFY })
            postBridgeResponse(buildBridgeMessage(BRIDGE_IDENTIFY_RESPONSE, requestId, response), event.origin)
          } catch (error) {
            postBridgeError(requestId, BRIDGE_IDENTIFY_REQUEST, "IDENTIFY_FAILED", toErrorMessage(error), event.origin)
          }
          return
        }

        case BRIDGE_SIGN_REQUEST: {
          const { payload, requestId } = event.data
          const { data } = payload
          const operation = data as Parameters<typeof validateOperation>[0]

          if (await validateOperation(operation) === false) {
            postBridgeError(requestId, BRIDGE_SIGN_REQUEST, "INVALID_SIGN_REQUEST", "Invalid operation", event.origin)
            return
          }

          try {
            const response = await sendApiMessage({ type: API_SIGN, data: operation, requestId })
            postBridgeResponse(buildBridgeMessage(BRIDGE_SIGN_RESPONSE, requestId, response), event.origin)
          } catch (error) {
            postBridgeError(requestId, BRIDGE_SIGN_REQUEST, "SIGN_FAILED", toErrorMessage(error), event.origin)
          }
        }
      }
    })
  }
})
