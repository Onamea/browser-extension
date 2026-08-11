import { describe, expect, it } from "vitest"
import { extensionReducer, initialState } from "./state.ts"

describe("extensionReducer", () => {
  it("clears decoded container data without removing the active container state", () => {
    const populatedState = {
      ...initialState,
      hasContainer: true,
      isUnlocked: true,
      accessKey: "access-key" as never,
      raw: "some-raw-data",
      data: { nameKey: "name-key" } as never
    }

    const clearedState = extensionReducer(populatedState, { type: "CLEAR_DATA" })

    expect(clearedState.raw).toBe("")
    expect(clearedState.data).toBeUndefined()
    expect(clearedState.hasContainer).toBe(true)
    expect(clearedState.isUnlocked).toBe(true)
    expect(clearedState.accessKey).toBe("access-key")
  })
})
