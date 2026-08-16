import isObject from "@/lib/utils/isObject.ts"
import { isString } from "@/lib/utils/isString.ts"

export const BRIDGE_NAMESPACE = "ONAMEA:BRIDGE"
export const BRIDGE_MARKER = "ONAMEA_BRIDGE_V0"
export const BRIDGE_WINDOW_API_KEY = "Onamea"

export const BRIDGE_IDENTIFY_REQUEST = `${ BRIDGE_NAMESPACE }:IDENTIFY_REQUEST`
export const BRIDGE_SIGN_REQUEST = `${ BRIDGE_NAMESPACE }:SIGN_REQUEST`
export const BRIDGE_IDENTIFY_RESPONSE = `${ BRIDGE_NAMESPACE }:IDENTIFY_RESPONSE`
export const BRIDGE_SIGN_RESPONSE = `${ BRIDGE_NAMESPACE }:SIGN_RESPONSE`
export const BRIDGE_ERROR_RESPONSE = `${ BRIDGE_NAMESPACE }:ERROR_RESPONSE`

export type BridgeBaseMessage = {
  marker: typeof BRIDGE_MARKER
  namespace: typeof BRIDGE_NAMESPACE
  type: string
  requestId: string
}

export type BridgeErrorPayload = {
  code: string
  message: string
}

export type BridgePayloadMap = {
  [BRIDGE_IDENTIFY_REQUEST]: Record<string, never>
  [BRIDGE_SIGN_REQUEST]: {
    data: unknown
  }
  [BRIDGE_IDENTIFY_RESPONSE]: Record<string, unknown>
  [BRIDGE_SIGN_RESPONSE]: Record<string, unknown>
  [BRIDGE_ERROR_RESPONSE]: {
    requestType: string
    error: BridgeErrorPayload
  }
}

export type BridgeMessage<TType extends keyof BridgePayloadMap> = BridgeBaseMessage & {
  type: TType
  payload: BridgePayloadMap[TType]
}

export type BridgeIdentifyRequest = BridgeMessage<typeof BRIDGE_IDENTIFY_REQUEST>

export type BridgeSignRequest = BridgeMessage<typeof BRIDGE_SIGN_REQUEST>

export type BridgeRequestMessage = BridgeIdentifyRequest | BridgeSignRequest

export type BridgeErrorResponse = BridgeMessage<typeof BRIDGE_ERROR_RESPONSE>

export type BridgeResponseMessage =
  | BridgeMessage<typeof BRIDGE_IDENTIFY_RESPONSE>
  | BridgeMessage<typeof BRIDGE_SIGN_RESPONSE>
  | BridgeErrorResponse

type BridgeRequestType = typeof BRIDGE_IDENTIFY_REQUEST | typeof BRIDGE_SIGN_REQUEST

export type BridgeValidator<TMessage extends BridgeRequestMessage = BridgeRequestMessage> = (message: TMessage) => boolean

const messageValidators = {
  [BRIDGE_IDENTIFY_REQUEST]: (_message: BridgeIdentifyRequest) => true,
  [BRIDGE_SIGN_REQUEST]: (message: BridgeSignRequest) => {
    return isObject(message.payload) && Object.prototype.hasOwnProperty.call(message.payload, "data")
  }
} satisfies {
  [BRIDGE_IDENTIFY_REQUEST]: BridgeValidator<BridgeIdentifyRequest>
  [BRIDGE_SIGN_REQUEST]: BridgeValidator<BridgeSignRequest>
}

const isBridgeBaseMessage = (message: unknown): message is BridgeBaseMessage => {
  if (isObject(message) === false) {
    return false
  }

  const candidate = message as {
    marker?: unknown
    namespace?: unknown
    type?: unknown
    requestId?: unknown
    payload?: unknown
  }

  if (candidate.marker !== BRIDGE_MARKER || candidate.namespace !== BRIDGE_NAMESPACE) {
    return false
  }

  return isString(candidate.type) && isString(candidate.requestId) && isObject(candidate.payload)
}

export const isBridgeRequestMessage = (message: unknown): message is BridgeRequestMessage => {
  if (isBridgeBaseMessage(message) === false) {
    return false
  }

  switch (message.type as BridgeRequestType) {
    case BRIDGE_IDENTIFY_REQUEST:
      return messageValidators[BRIDGE_IDENTIFY_REQUEST](message as BridgeIdentifyRequest)

    case BRIDGE_SIGN_REQUEST:
      return messageValidators[BRIDGE_SIGN_REQUEST](message as BridgeSignRequest)

    default:
      return false
  }
}

export const isSamePageHttpOrigin = (eventOrigin: string, pageOrigin: string): boolean => {
  if (eventOrigin !== pageOrigin) {
    return false
  }

  try {
    const origin = new URL(eventOrigin)
    return origin.protocol === "http:" || origin.protocol === "https:"
  } catch {
    return false
  }
}

export const buildBridgeMessage = <TType extends string, TPayload extends Record<string, unknown>>(
  type: TType,
  requestId: string,
  payload: TPayload
): BridgeBaseMessage & { type: TType, payload: TPayload } => {
  return {
    marker: BRIDGE_MARKER,
    namespace: BRIDGE_NAMESPACE,
    type,
    requestId,
    payload
  }
}

export const buildBridgeErrorResponse = (
  requestId: string,
  requestType: string,
  code: string,
  message: string
): BridgeErrorResponse => {
  return buildBridgeMessage<typeof BRIDGE_ERROR_RESPONSE, BridgeErrorResponse["payload"]>(BRIDGE_ERROR_RESPONSE, requestId, {
    requestType,
    error: {
      code,
      message
    }
  })
}

export const toErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message
  }

  if (isString(error)) {
    return error
  }

  return "Unknown error"
}
