import type { FingerprintedName, NameKey } from "@onamea/types"
import type { SubKeyDomain } from "@onamea/crdt"

export type Signer = {
  nameKey: NameKey
  fingerprintedName: FingerprintedName
  isSubKey: boolean
  subKeyDomain?: SubKeyDomain
}

type Props = {
  signers: Signer[]
  selectedSigner: NameKey
  onChange: (signer: NameKey) => void
}

const displaySubKeyDomain = (subKeyDomain?: SubKeyDomain) => {
  return subKeyDomain !== "" && subKeyDomain !== undefined ? subKeyDomain : "*"
}

const SignerSelect = ({ signers, selectedSigner, onChange }: Props) => {
  return (
    <select
      value={ selectedSigner }
      onChange={ event => onChange(event.target.value as NameKey) }
      >
      { signers.map(signer => (
        <option key={ signer.nameKey } value={ signer.nameKey }>
          { signer.fingerprintedName }
          { signer.isSubKey ? ` (${ displaySubKeyDomain(signer.subKeyDomain) })` : "" }
        </option>
      )) }
    </select>
  )
}

export default SignerSelect
