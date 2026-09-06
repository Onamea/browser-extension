import type { ContainerDataEntry } from "../types/ContainerData.ts"
import SecretDisplay from "./SecretDisplay.tsx"

type Props = {
  entry: ContainerDataEntry
}

const ContainerDataEntryDisplay = ({ entry }: Props) => {

  const { nameKey, keyPair: { cryptoName, publicKeyDisplay, privateKeyDisplay, mnemonicDisplay } } = entry

  return (
    <div>
      <p><strong>NameKey: </strong>{ nameKey }</p>
      <p><strong>CryptoName: </strong>{ cryptoName }</p>
      <p><strong>PublicKey: </strong>{ publicKeyDisplay }</p>
      <p><strong>PrivateKey: </strong><SecretDisplay secret={ privateKeyDisplay } /></p>
      { mnemonicDisplay !== undefined && 
        <p><strong>Mnemonic: </strong><SecretDisplay secret={ mnemonicDisplay } /></p>
      }
    </div>
  )
}

export default ContainerDataEntryDisplay
