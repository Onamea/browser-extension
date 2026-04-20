import { type SlotData, computeLayout, CONTAINER_METADATA_SIZE, OPFSHandle, PDECContainer } from "@mikeobank/pdec"

let container: PDECContainer | undefined

const getContainer = async (): Promise<PDECContainer> => {
  if (container === undefined) {
    const layout = computeLayout({ metadataBytes: CONTAINER_METADATA_SIZE })
    try {
      const handle = await OPFSHandle.open("vault.pdec")
      container = await PDECContainer.openHandle(handle)
    } catch {
      const handle = await OPFSHandle.create("vault.pdec", layout.totalSize)
      container = await PDECContainer.create(handle, layout)
    }
  }
  return container
}

export const readSlot = async (secret: string): Promise<SlotData | undefined> => {
  const container = await getContainer()
  const slot = await container.read(secret)
  return slot
}

export const writeSlot = async (secret: string, data: string): Promise<SlotData> => {
  const container = await getContainer()
  const encodedData = new TextEncoder().encode(data)
  return await container.write(secret, encodedData)
}
