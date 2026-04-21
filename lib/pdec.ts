import { type SlotData, computeLayout, CONTAINER_METADATA_SIZE, OPFSHandle, PDECContainer } from "@mikeobank/pdec"

let container: PDECContainer | undefined

export const openContainer = async (): Promise<boolean> => {
  if (container !== undefined) return true
  try {
    const handle = await OPFSHandle.open("vault.pdec")
    container = await PDECContainer.openHandle(handle)
    return true
  } catch {
    return false
  }
}

export const readSlot = async (secret: string): Promise<SlotData | undefined> => {
  if (container === undefined) return undefined
  return await container.read(secret)
}

export const writeSlot = async (secret: string, data: string): Promise<SlotData> => {
  if (container === undefined) {
    const layout = computeLayout({ metadataBytes: CONTAINER_METADATA_SIZE })
    const handle = await OPFSHandle.create("vault.pdec", layout.totalSize)
    container = await PDECContainer.create(handle, layout)
  }
  const encodedData = new TextEncoder().encode(data)
  return await container.write(secret, encodedData)
}

export const decodeSlotData = (slotData: SlotData): unknown => {
  const str = new TextDecoder().decode(slotData.data)
  return JSON.parse(str)
}
