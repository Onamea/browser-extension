import { describe, expect, it } from "vitest"
import {
  MINING_OFFSCREEN_START,
  MINING_START,
  type OffscreenStartMiningMessage,
  type StartMiningMessage
} from "./mining.ts"

describe("mining start messages", () => {
  it("supports shouldGenerateMnemonic in start messages", () => {
    const startMessage: StartMiningMessage = {
      type: MINING_START,
      requestId: "req-1",
      name: "example",
      shouldGenerateMnemonic: true
    }

    const offscreenMessage: OffscreenStartMiningMessage = {
      type: MINING_OFFSCREEN_START,
      requestId: "req-2",
      name: "example",
      shouldGenerateMnemonic: true
    }

    expect(startMessage.shouldGenerateMnemonic).toBe(true)
    expect(offscreenMessage.shouldGenerateMnemonic).toBe(true)
  })
})
