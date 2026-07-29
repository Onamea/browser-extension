import { isString } from "./utils/isString.ts"
import { toBase64 } from "./utils/base64.ts"

export type AccessKey = string

const byteLength = 32
const base64Length = 4 * Math.ceil(byteLength / 3)

export const isAccessKey = (value: unknown): value is AccessKey => {
  return isString(value) && value.length === base64Length
}

export const generateAccessKey = (): AccessKey => {
  const array = new Uint8Array(byteLength)
  crypto.getRandomValues(array)
  return toBase64(array)
}
