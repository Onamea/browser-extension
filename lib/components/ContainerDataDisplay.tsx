import type { ContainerData } from "../background/ContainerData.ts"

type Props = {
  data: ContainerData
}

const ContainerDataDisplay = ({ data }: Props) => {
  const { nameKey, fingerprintedName, keyPair } = data
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

export default ContainerDataDisplay
