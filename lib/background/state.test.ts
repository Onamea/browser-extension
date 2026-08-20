import { describe, expect, it } from "vitest"
import { extensionReducer, initialState } from "./state.ts"

describe("extensionReducer", () => {
  it("clears decoded container data without removing the active container state", () => {
    const populatedState = {
      ...initialState,
      container: {
        ...initialState.container,
        hasContainer: true,
        isUnlocked: true,
        accessKey: "access-key" as never,
        raw: "some-raw-data",
        data: { nameKey: "name-key" } as never
      }
    }

    const clearedState = extensionReducer(populatedState, { type: "CLEAR_SESSION_DATA" })

    expect(clearedState.container.raw).toBe("")
    expect(clearedState.container.data).toBeUndefined()
    expect(clearedState.container.hasContainer).toBe(true)
    expect(clearedState.container.isUnlocked).toBe(true)
    expect(clearedState.container.accessKey).toBe("access-key")
  })
})
