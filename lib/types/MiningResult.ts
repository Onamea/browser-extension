import type { NameKey, KeyPairDisplay, KeyPairAsJSON } from "@onamea/types"
import { isCryptoName, isMnemonicDisplay, isNameKey, isPrivateKey, isPrivateKeyDisplay, isPublicKey, isPublicKeyDisplay, parseKeyPairAsJSON } from "@onamea/types"
import isObject from "../utils/isObject.ts"

type Uint8ArrayObject = Record<string, number>

const isUint8ArrayObject = (value: unknown): value is Uint8ArrayObject => {
  if (isObject(value) === false) {
    return false
  }
  const candidate = value as Uint8ArrayObject
  return Object.entries(candidate).every(([k, v]) => typeof k === "string" && typeof v === "number")
}

export type MiningResult = KeyPairDisplay & {
  nameKey: NameKey
}

export type UnparsedMiningResult = MiningResult & KeyPairAsJSON

export const parseMiningResult = (result: unknown): MiningResult => {
  if (isUnparsedMiningResult(result) === false) {
    throw new Error("Invalid UnparsedMiningResult")
  }

  return {
    ...result,
    ...parseKeyPairAsJSON(result)
  }
}

const isMiningResultShape = (
  value: unknown,
  publicKeyValidator: (value: unknown) => boolean,
  privateKeyValidator: (value: unknown) => boolean
): boolean => {
  if (isObject(value) === false) {
    return false
  }

  const candidate = value as {
    nameKey?: unknown
    cryptoName?: unknown
    publicKey?: unknown
    publicKeyDisplay?: unknown
    privateKey?: unknown
    privateKeyDisplay?: unknown
    mnemonicDisplay?: unknown
  }

  if (isNameKey(candidate.nameKey) === false) {
    return false
  }
  if (isCryptoName(candidate.cryptoName) === false) {
    return false
  }
  if (publicKeyValidator(candidate.publicKey) === false) {
    return false
  }
  if (isPublicKeyDisplay(candidate.publicKeyDisplay) === false) {
    return false
  }
  if (privateKeyValidator(candidate.privateKey) === false) {
    return false
  }
  if (isPrivateKeyDisplay(candidate.privateKeyDisplay) === false) {
    return false
  }
  if (candidate.mnemonicDisplay !== undefined && isMnemonicDisplay(candidate.mnemonicDisplay) === false) {
    return false
  }

  return true
}

export const isMiningResult = (value: unknown): value is MiningResult => {
  return isMiningResultShape(value, isPublicKey, isPrivateKey)
}

export const isUnparsedMiningResult = (value: unknown): value is UnparsedMiningResult => {
  return isMiningResultShape(value, isUint8ArrayObject, isUint8ArrayObject)
}
