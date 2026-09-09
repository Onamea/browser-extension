import { useState } from "react"
import type { NameKey } from "@onamea/types"
import type { IdentityWithMessages } from "@onamea/crdt"
import SignerSelect from "./SignerSelect.tsx"
import { useSigners } from "../hooks/useSigners.ts"

type Props = {
  identity: IdentityWithMessages
  pageOrigin: string
  onConfirm: (key: NameKey, shouldSaveLocally: boolean) => Promise<void>
  onReject: () => Promise<void>
}

const SignConfirmationForm = ({ identity, pageOrigin, onConfirm, onReject }: Props) => {

  const [checked, setChecked] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { signers, selectedSigner, setSelectedSigner } = useSigners(identity, pageOrigin)

  const handleConfirm = async () => {
    setIsSubmitting(true)
    try {
      await onConfirm(selectedSigner, checked)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReject = async () => {
    setIsSubmitting(true)
    try {
      await onReject()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form>
      <label>
        Signer:
        <SignerSelect signers={ signers } selectedSigner={ selectedSigner } onChange={ setSelectedSigner } />
      </label>
      <label>
        <input type="checkbox" checked={ checked } onChange={ e => setChecked(e.target.checked) } />
        Save Message locally
      </label>
      <menu>
        <button type="button" disabled={ isSubmitting } onClick={ handleConfirm }>Confirm</button>
        <button type="button" disabled={ isSubmitting } onClick={ handleReject }>Reject</button>
      </menu>
    </form>
  )
}

export default SignConfirmationForm
