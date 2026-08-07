import { validateOperation } from "@vanice/crdt"
import { API_IDENTIFY, API_SIGN } from "@/lib/messaging/api.ts"

export default defineContentScript({
  matches: ["<all_urls>"],
  main: () => {
    globalThis.addEventListener("message", async event => {
      if ((event.source as unknown) !== globalThis) return
      switch (event.data?.type) {
        case "IDENTIFY_REQUEST": {
          const { requestId } = event.data
          browser.runtime.sendMessage({ type: API_IDENTIFY }, (response: Record<string, unknown>) => {
            globalThis.postMessage({ type: "IDENTIFY_RESPONSE", ...response, requestId }, event.origin)
          })
          return
        }
        case "SIGN_REQUEST": {
          const { data, requestId } = event.data
          if (await validateOperation(data) === false) {
            globalThis.postMessage({ type: "INVALID_SIGN_REQUEST", error: "Invalid operation", requestId }, event.origin)
            return
          }
          browser.runtime.sendMessage({ type: API_SIGN, data, requestId }, (response: Record<string, unknown>) => {
            globalThis.postMessage({ type: "SIGN_RESPONSE", ...response }, event.origin)
          })
        }
      }
    })
  }
})
