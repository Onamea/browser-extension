import type { ContainerData } from "../types/ContainerData.ts"
import SecretDisplay from "./SecretDisplay.tsx"

type Props = {
  data: ContainerData
}

const ContainerDataDisplay = ({ data }: Props) => {

  const { nameKey, fingerprintedName, keyPair } = data
  const { cryptoName, publicKeyDisplay, privateKeyDisplay, mnemonicDisplayWithPassphrase } = keyPair

  return (
    <div>
      <p><strong>Name key:</strong> { nameKey }</p>
      <p><strong>Fingerprinted name:</strong> { fingerprintedName }</p>
      <p><strong>Crypto name:</strong> { cryptoName }</p>
      <p><strong>Public key:</strong> { publicKeyDisplay }</p>
      <p><strong>Private key:</strong> <SecretDisplay secret={ privateKeyDisplay } /></p>
      {
        mnemonicDisplayWithPassphrase !== undefined
          ? <p><strong>Mnemonic:</strong> <SecretDisplay secret={ mnemonicDisplayWithPassphrase } /></p>
          : null
      }
    </div>
  )
}

export default ContainerDataDisplay
