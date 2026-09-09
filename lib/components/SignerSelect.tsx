import type { NameKey } from "@onamea/types"
import type { SubKeyDomain } from "@onamea/crdt"
import type { Signer } from "../hooks/useSigners.ts"

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
        <option key={ signer.id } value={ signer.id }>
          { signer.displayName }
          { signer.isSubKey ? ` (${ displaySubKeyDomain(signer.subKeyDomain) })` : "" }
        </option>
      )) }
    </select>
  )
}

export default SignerSelect
