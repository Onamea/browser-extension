const encoder = new TextEncoder()
const decoder = new TextDecoder()

export const encode = (input: string): Uint8Array => {
  return encoder.encode(input)
}

export const decode = (input: Uint8Array): string => {
  return decoder.decode(input)
}
