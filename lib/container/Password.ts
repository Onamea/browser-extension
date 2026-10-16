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

export const passwordStrength = (password: string): [number, string | undefined] => {
  const trimmedPassword = password.trim()
  if (isPassword(password) === false) {
    const value = 6 * trimmedPassword.length / PASSWORD_MIN_LENGTH
    return [value, undefined]
  }
  const value = 6 + ((trimmedPassword.length - PASSWORD_MIN_LENGTH) / PASSWORD_MIN_LENGTH)
  const strength = value > 10 ? 10 : value
  const display = (strength >= 10 ? 9.9 : strength).toFixed(1)
  return [strength, display]
}
