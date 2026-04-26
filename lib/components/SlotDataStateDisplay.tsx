import type { SlotDataState } from "../background/state.ts"

type Props = {
  slotData: SlotDataState
}

const SlotDataDisplay = ({ slotData }: Props) => {
  const { nameKey, fingerprintedName, keyPair } = slotData
  const { cryptoName, publicKeyDisplay, privateKeyDisplay, mnemonicDisplayWithPassphrase } = keyPair
  const displayData = {
    nameKey,
    fingerprintedName,
    keyPair: {
      cryptoName,
      publicKeyDisplay,
      privateKeyDisplay,
      mnemonicDisplayWithPassphrase
    }
  }
  return <pre>{ JSON.stringify(displayData, null, 2) }</pre>
}

export default SlotDataDisplay
