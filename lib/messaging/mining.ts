import type { FingerprintDisplay, Name } from "@vanice/types"
import { isUnparsedMiningResult } from "@/lib/types/MiningResult.ts"
import isObject from "@/lib/utils/isObject.ts"
import { isString } from "@/lib/container/utils/isString.ts"

export const MINING_START = "MINING:START"
export const MINING_ABORT = "MINING:ABORT"
export const MINING_OFFSCREEN_START = "MINING:OFFSCREEN_START"
export const MINING_OFFSCREEN_ABORT = "MINING:OFFSCREEN_ABORT"
export const MINING_PROGRESS = "MINING:PROGRESS"
export const MINING_RESULT = "MINING:RESULT"
export const MINING_ERROR = "MINING:ERROR"

type AbstractMiningMessage = {
  type: string
  requestId: string
}

export type StartMiningMessage = {
  type: typeof MINING_START
  requestId: string
  name: Name
  fingerprintDisplay?: FingerprintDisplay
}

export type AbortMiningMessage = {
  type: typeof MINING_ABORT
  requestId?: string
}

export type OffscreenStartMiningMessage = {
  type: typeof MINING_OFFSCREEN_START
  requestId: string
  name: Name
  fingerprintDisplay?: FingerprintDisplay
}

export type OffscreenAbortMiningMessage = {
  type: typeof MINING_OFFSCREEN_ABORT
  requestId?: string
}

export type MiningProgressMessage = {
  type: typeof MINING_PROGRESS
  requestId: string
  totalAttempts: number
}

export type MiningResultMessage = {
  type: typeof MINING_RESULT
  requestId: string
  result: unknown
}

export type MiningErrorMessage = {
  type: typeof MINING_ERROR
  requestId: string
  error: string
}

export type MiningMessage = MiningProgressMessage | MiningResultMessage | MiningErrorMessage

export type MiningControlMessage = StartMiningMessage | AbortMiningMessage

export type OffscreenMiningControlMessage = OffscreenStartMiningMessage | OffscreenAbortMiningMessage

export const isAbstractMiningMessage = (message: unknown): message is AbstractMiningMessage => {
  if (isObject(message) === false) {
    return false
  }

  const candidate = message as { type?: unknown, requestId?: unknown }
  if (isString(candidate.type) === false || [MINING_PROGRESS, MINING_RESULT, MINING_ERROR].includes(candidate.type) === false) {
    return false
  }

  if (isString(candidate.requestId) === false) {
    return false
  }

  return true
}

export const isMiningProgressMessage = (message: unknown): message is MiningProgressMessage => {
  if (isAbstractMiningMessage(message) === false) {
    return false
  }

  if (message.type !== MINING_PROGRESS) {
    return false
  }

  const candidate = message as AbstractMiningMessage & { totalAttempts?: unknown }
  return typeof candidate.totalAttempts === "number"
}

export const isMiningErrorMessage = (message: unknown): message is MiningErrorMessage => {
  if (isAbstractMiningMessage(message) === false) {
    return false
  }

  if (message.type !== MINING_ERROR) {
    return false
  }

  const candidate = message as AbstractMiningMessage & { error?: unknown }
  return isString(candidate.error)
}

export const isMiningResultMessage = (message: unknown): message is MiningResultMessage => {
  if (isAbstractMiningMessage(message) === false) {
    return false
  }

  if (message.type !== MINING_RESULT) {
    return false
  }

  const candidate = message as AbstractMiningMessage & { result?: unknown }
  return isUnparsedMiningResult(candidate.result)
}
