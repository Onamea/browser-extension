import { describe, expect, it } from "vitest"
import { parseMiningResult } from "./MiningResult.ts"
import {
  appendContainerDataEntry,
  buildContainerDataEntryFromMiningResult,
  decodeSessionData,
  encodeSessionData,
  findEntryInContainerData
} from "./ContainerData.ts"

describe("parseMiningResult", () => {
  it("preserves mnemonic display data when present", () => {
    const publicKey = Object.fromEntries(Array.from({ length: 32 }, (_, index) => [index, 1]))
    const privateKey = Object.fromEntries(Array.from({ length: 48 }, (_, index) => [index, 2]))
    const mnemonicDisplay = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about"

    const parsed = parseMiningResult({
      nameKey: "Vanic@2B5E9HJQPKJADKCK0SD3G7XEHNFYSXKVPQ9CVS6EW8G1N5031",
      cryptoName: "Ed25519",
      publicKey,
      publicKeyDisplay: "11".repeat(32),
      privateKey,
      privateKeyDisplay: "22".repeat(48),
      mnemonicDisplay
    })

    expect(parsed.publicKey instanceof Uint8Array).toBeTruthy()
    expect(parsed.privateKey instanceof Uint8Array).toBeTruthy()
  })
})

describe("ContainerData", () => {
  const createMiningResult = (nameKey: string) => ({
    nameKey,
    cryptoName: "Ed25519",
    publicKey: Object.fromEntries(Array.from({ length: 32 }, (_, index) => [index, 1])),
    publicKeyDisplay: "11".repeat(32),
    privateKey: Object.fromEntries(Array.from({ length: 48 }, (_, index) => [index, 2])),
    privateKeyDisplay: "22".repeat(48)
  })

  it("encodes and decodes entries as an array", () => {
    const identityNameKey = "Vanic@2B5E9HJQPKJADKCK0SD3G7XEHNFYSXKVPQ9CVS6EW8G1N5031"
    const subKeyNameKey = "Vanic@3B5E9HJQPKJADKCK0SD3G7XEHNFYSXKVPQ9CVS6EW8G1N5031"
    const data = [
      buildContainerDataEntryFromMiningResult(createMiningResult(identityNameKey)),
      buildContainerDataEntryFromMiningResult(createMiningResult(subKeyNameKey))
    ]

    const decoded = decodeSessionData(encodeSessionData(data))

    expect(decoded).toHaveLength(2)
    expect(findEntryInContainerData(decoded ?? [], identityNameKey)?.nameKey).toBe(identityNameKey)
    expect(findEntryInContainerData(decoded ?? [], subKeyNameKey)?.nameKey).toBe(subKeyNameKey)
  })

  it("preserves existing entries when appending a new one and rejects duplicates", () => {
    const existing = [
      buildContainerDataEntryFromMiningResult(createMiningResult("Vanic@4B5E9HJQPKJADKCK0SD3G7XEHNFYSXKVPQ9CVS6EW8G1N5031")),
      buildContainerDataEntryFromMiningResult(createMiningResult("Vanic@5B5E9HJQPKJADKCK0SD3G7XEHNFYSXKVPQ9CVS6EW8G1N5031"))
    ]
    const next = buildContainerDataEntryFromMiningResult(createMiningResult("Vanic@6B5E9HJQPKJADKCK0SD3G7XEHNFYSXKVPQ9CVS6EW8G1N5031"))
    const duplicate = existing[0]!

    expect(appendContainerDataEntry(existing, next)).toEqual([...existing, next])
    expect(() => appendContainerDataEntry(existing, duplicate)).toThrowError(/already exists/i)
  })
})
