export const isString = (value: unknown): value is string => {
  return typeof value === "string"
}

export const isNonEmptyString = (value: unknown): value is string => {
  return isString(value) && value.trim() !== ""
}
