import type { ContainerData } from "../types/ContainerData.ts"
import SecretDisplay from "./SecretDisplay.tsx"

type Props = {
  data: ContainerData
}

const ContainerDataDisplay = ({ data }: Props) => {

  const { identity: {
    nameKey,
    keyPair: { cryptoName, publicKeyDisplay, privateKeyDisplay, mnemonicDisplay }
  } } = data

  return (
    <div>
      <p><strong>NameKey: </strong>{ nameKey }</p>
      <p><strong>CryptoName: </strong>{ cryptoName }</p>
      <p><strong>PublicKey: </strong>{ publicKeyDisplay }</p>
      <p><strong>PrivateKey: </strong><SecretDisplay secret={ privateKeyDisplay } /></p>
      {
        mnemonicDisplay !== undefined
          ? <p><strong>Mnemonic:</strong> <SecretDisplay secret={ mnemonicDisplay } /></p>
          : null
      }
    </div>
  )
}

export default ContainerDataDisplay
