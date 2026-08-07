import { isRuntimeMessage, type RuntimeMessage } from "../runtimeMessage.ts"

export const sendRuntimeMessage = <TResponse = unknown>(message: RuntimeMessage): Promise<TResponse> => {
  return browser.runtime.sendMessage(message) as Promise<TResponse>
}

export const subscribeRuntimeMessages = (listener: (message: unknown) => void) => {
  const wrappedListener = (message: unknown) => {
    if (isRuntimeMessage(message) === false) {
      return
    }

    listener(message)
  }

  browser.runtime.onMessage.addListener(wrappedListener)
  return () => {
    browser.runtime.onMessage.removeListener(wrappedListener)
  }
}
