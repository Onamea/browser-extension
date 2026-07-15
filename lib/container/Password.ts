import { PASSWORD_MIN_LENGTH } from "./constants.ts"
import { isString } from "./utils/isString.ts"

export type Password = string

export const isPassword = (value: unknown): value is Password => {
  return isString(value) && value.trim().length >= PASSWORD_MIN_LENGTH
}

export const parsePassword = (value: string): Password => {
  const password = value.trim()
  if (isPassword(password) === false) {
    throw new Error(`Password must be at least ${ PASSWORD_MIN_LENGTH } characters long.`)
  }
  return password
}
