import isObject from "../utils/isObject.ts"
import { isString } from "../utils/isString.ts"

export type RuntimeMessage = {
  type: string
  [key: string]: unknown
}

export const isRuntimeMessage = (message: unknown): message is RuntimeMessage => {
  if (isObject(message) === false) {
    return false
  }

  return isString(message.type)
}
