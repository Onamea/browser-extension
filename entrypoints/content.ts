import { validateOperation } from "@vanice/crdt"

export default defineContentScript({
  matches: ["<all_urls>"],
  main: () => {
    globalThis.addEventListener("message", async event => {
      if ((event.source as unknown) !== globalThis || event.data?.type !== "SIGN_REQUEST") return
      const { data, requestId } = event.data
      if (await validateOperation(data) === false) {
        globalThis.postMessage({ type: "INVALID_SIGN_REQUEST", error: "Invalid operation", requestId }, "*")
        return
      }
      browser.runtime.sendMessage({ type: "SIGN", data, requestId }, (response: Record<string, unknown>) => {
        globalThis.postMessage({ type: "SIGN_RESPONSE", ...response }, "*")
      })
    })
  }
})
