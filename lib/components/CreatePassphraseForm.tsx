import type { FormEvent } from "react"
import type { SlotData } from "@mikeobank/pdec"
import { useState } from "react"
import ErrorDisplay from "./ErrorDisplay.tsx"
import { validatePassphrase } from "@mikeobank/pdec"
import { writeSlot } from "../pdec.ts"

type Props = {
  setSlot: (slot: SlotData) => void
}

const CreatePassphraseForm = ({ setSlot }: Props) => {
  const [passphrase, setPassphrase] = useState("")
  const [passphraseConfirm, setPassphraseConfirm] = useState("")
  const [errors, setErrors] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const result = validatePassphrase(passphrase)
    const validationErrors = [...result.errors]
    if (passphrase !== passphraseConfirm) {
      validationErrors.push("Passphrases do not match")
    }
    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      return
    }
    setErrors([])
    setIsSubmitting(true)
    const slot = await writeSlot(passphrase, "")
    setIsSubmitting(false)
    setSlot(slot)
  }

  return (
    <form onSubmit={ handleSubmit }>
      <div>
        <label htmlFor="passphrase">Passphrase:</label>
        <input
          id="passphrase"
          type="password"
          value={ passphrase }
          onChange={ event => setPassphrase(event.target.value) }
          placeholder="Passphrase"
        />
      </div>
      <div>
        <label htmlFor="passphraseConfirm">Confirm passphrase:</label>
        <input
          id="passphraseConfirm"
          type="password"
          value={ passphraseConfirm }
          onChange={ event => setPassphraseConfirm(event.target.value) }
          placeholder="Confirm passphrase"
        />
      </div>
      <ErrorDisplay errors={ errors } />
      <button type="submit" disabled={ isSubmitting }>{ isSubmitting ? "..." : "Create" }</button>
    </form>
  )
}

export default CreatePassphraseForm
