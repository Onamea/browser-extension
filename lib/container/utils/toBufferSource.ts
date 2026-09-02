export const toBufferSource = (bytes: Uint8Array): Uint8Array<ArrayBuffer> => {
  if (bytes.buffer instanceof ArrayBuffer) {
    return bytes as Uint8Array<ArrayBuffer>
  }

  return Uint8Array.from(bytes)
}

