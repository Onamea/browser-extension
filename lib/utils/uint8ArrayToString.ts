export const objectToUint8Array = (obj: Record<string, number>): Uint8Array => {
  return new Uint8Array(Object.values(obj))
}

export const uint8ArrayToString = (data: Uint8Array | Record<string, number>): string => {
  const arr = data instanceof Uint8Array ? data : objectToUint8Array(data)
  return new TextDecoder().decode(arr)
}
