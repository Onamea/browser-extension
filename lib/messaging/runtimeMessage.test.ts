import { describe, expect, it } from "vitest"
import { isRuntimeMessage } from "./runtimeMessage.ts"

describe("isRuntimeMessage", () => {
  it("accepts well-formed runtime messages", () => {
    expect(isRuntimeMessage({ type: "TEST" })).toBe(true)
    expect(isRuntimeMessage({ type: "TEST", payload: 1 })).toBe(true)
  })

  it("rejects malformed runtime messages", () => {
    expect(isRuntimeMessage(null)).toBe(false)
    expect(isRuntimeMessage({})).toBe(false)
    expect(isRuntimeMessage({ type: 1 })).toBe(false)
    expect(isRuntimeMessage("TEST")).toBe(false)
    expect(isRuntimeMessage([])).toBe(false)
  })
})
