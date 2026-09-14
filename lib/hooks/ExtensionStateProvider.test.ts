import { describe, expect, it, vi } from "vitest"
import { createCreateOperation } from "@onamea/crdt"
import type { IdentityWithMessages, Message, Operation } from "@onamea/crdt"
import type { NameKey } from "@onamea/types"
import { createSignAndAppendOperation } from "./ExtensionStateProvider.tsx"

describe("createSignAndAppendOperation", () => {
  it("attaches and signs the requested operation", async () => {
    const identity = {
      id: "alice",
      operations: [await createCreateOperation("alice")],
      messages: []
    } as unknown as IdentityWithMessages
    const signedMessage = {} as Message
    const signAndAppendOperation = vi.fn<(
      operation: Operation,
      nameKey: NameKey,
      shouldAppend?: boolean
    ) => Promise<Message>>(() => Promise.resolve(signedMessage))

    const result = await createSignAndAppendOperation(
      identity,
      "SET",
      "body",
      undefined,
      signAndAppendOperation
    )

    expect(result).toBe(signedMessage)
    expect(signAndAppendOperation).toHaveBeenCalledOnce()
    expect(signAndAppendOperation.mock.calls[0]?.[0]).toMatchObject({
      id: "alice",
      type: "SET",
      body: "body",
      previousHash: identity.operations[0]?.hash
    })
    expect(signAndAppendOperation.mock.calls[0]?.[1]).toBe("alice")
  })

  it("returns undefined when signing fails", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})
    const identity = {
      id: "alice",
      operations: [await createCreateOperation("alice")],
      messages: []
    } as unknown as IdentityWithMessages
    const signAndAppendOperation = vi.fn<(
      operation: Operation,
      nameKey: NameKey,
      shouldAppend?: boolean
    ) => Promise<Message>>(() => Promise.reject(new Error("Signing failed")))

    const result = await createSignAndAppendOperation(
      identity,
      "SET",
      "body",
      undefined,
      signAndAppendOperation
    )

    expect(result).toBeUndefined()
    expect(signAndAppendOperation).toHaveBeenCalledOnce()
    expect(consoleError).toHaveBeenCalledWith(
      "Failed to create, sign, and append operation:",
      expect.any(Error)
    )
  })
})
