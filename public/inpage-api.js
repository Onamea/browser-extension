(() => {
  const BRIDGE_NAMESPACE = "ONAMEA:BRIDGE"
  const BRIDGE_MARKER = "ONAMEA_BRIDGE_V0"
  const BRIDGE_WINDOW_API_KEY = "Onamea"

  const BRIDGE_IDENTIFY_REQUEST = `${ BRIDGE_NAMESPACE }:IDENTIFY_REQUEST`
  const BRIDGE_SIGN_REQUEST = `${ BRIDGE_NAMESPACE }:SIGN_REQUEST`
  const BRIDGE_IDENTIFY_RESPONSE = `${ BRIDGE_NAMESPACE }:IDENTIFY_RESPONSE`
  const BRIDGE_SIGN_RESPONSE = `${ BRIDGE_NAMESPACE }:SIGN_RESPONSE`
  const BRIDGE_ERROR_RESPONSE = `${ BRIDGE_NAMESPACE }:ERROR_RESPONSE`

  const buildRequest = (type, payload) => ({
    marker: BRIDGE_MARKER,
    namespace: BRIDGE_NAMESPACE,
    type,
    requestId: crypto.randomUUID(),
    payload
  })

  const waitForBridgeResponse = (requestType, responseType, requestId) => {
    return new Promise((resolve, reject) => {
      const onMessage = event => {
        const message = event.data
        if (message === null || typeof message !== "object") return
        if (message.marker !== BRIDGE_MARKER || message.namespace !== BRIDGE_NAMESPACE) return
        if (message.requestId !== requestId) return

        if (message.type === responseType) {
          globalThis.removeEventListener("message", onMessage)
          resolve(message.payload)
          return
        }

        if (message.type === BRIDGE_ERROR_RESPONSE && message.payload?.requestType === requestType) {
          globalThis.removeEventListener("message", onMessage)
          reject(message.payload?.error ?? { code: "BRIDGE_ERROR", message: "Unknown bridge error" })
        }
      }

      globalThis.addEventListener("message", onMessage)
    })
  }

  const requestBridge = (requestType, responseType, payload) => {
    const request = buildRequest(requestType, payload)
    const pending = waitForBridgeResponse(requestType, responseType, request.requestId)
    globalThis.postMessage(request, globalThis.location.origin)
    return pending
  }

  const api = {
    identify: () => {
      return requestBridge(BRIDGE_IDENTIFY_REQUEST, BRIDGE_IDENTIFY_RESPONSE, {})
    },
    sign: data => {
      return requestBridge(BRIDGE_SIGN_REQUEST, BRIDGE_SIGN_RESPONSE, { data })
    },
    namespace: BRIDGE_NAMESPACE,
    marker: BRIDGE_MARKER,
    version: "1"
  }

  Object.defineProperty(globalThis, BRIDGE_WINDOW_API_KEY, {
    value: api,
    writable: false,
    configurable: false,
    enumerable: false
  })
})()
