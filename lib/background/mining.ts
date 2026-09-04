import { createWorkerPool } from "@onamea/workers"
import type { FingerprintDisplay, Name } from "@onamea/types"

const NUM_WORKERS = 8
const WORKER_PROGRESS_INTERVAL_MS = 500

type StartMiningOptions = {
  name: Name
  fingerprintDisplay?: FingerprintDisplay
  shouldGenerateMnemonic?: boolean
}

type MiningCallbacks = {
  onProgress?: (totalAttempts: number) => void
  onResult?: (result: unknown) => void
  onError?: (error: string) => void
  onComplete?: () => void
}

export const shouldUseOffscreenMining = () => {
  const chromeApi = (globalThis as typeof globalThis & { chrome?: { offscreen?: unknown } }).chrome
  return chromeApi?.offscreen !== undefined
}

export const startMining = (options: StartMiningOptions, callbacks: MiningCallbacks = {}) => {
  const miningWorkerUrl = new URL(browser.runtime.getURL("/workers/worker.js"))
  const { promise, abort } = createWorkerPool(
    options.shouldGenerateMnemonic ? "Schnorr" : "Ed25519",
    options.name,
    options.fingerprintDisplay,
    NUM_WORKERS,
    miningWorkerUrl,
    ({ totalAttempts }) => callbacks.onProgress?.(totalAttempts),
    1000,
    options.shouldGenerateMnemonic,
    undefined,
    undefined,
    WORKER_PROGRESS_INTERVAL_MS
  )

  void promise
    .then(result => {
      if (result === undefined || result.privateKey === undefined || result.privateKeyDisplay === undefined) {
        callbacks.onError?.("Mining timed out. Try a shorter name.")
        return
      }

      callbacks.onResult?.(result)
    })
    .catch(error => {
      console.error("Mining error:", error)
      callbacks.onError?.(String(error))
    })
    .finally(() => callbacks.onComplete?.())

  return { abort }
}
