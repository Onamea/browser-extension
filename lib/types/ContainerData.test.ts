import { describe, expect, it } from "vitest"
import { parseMiningResult } from "./MiningResult.ts"

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

    expect(parsed.mnemonicDisplayWithPassphrase).toBe(mnemonicDisplay)
  })
})
