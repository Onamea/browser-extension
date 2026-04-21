import type { FormEvent } from "react"
import type { SlotData } from "@mikeobank/pdec"
import { useState } from "react"
import ErrorDisplay from "./ErrorDisplay.tsx"
import { validatePassphrase } from "@mikeobank/pdec"
import { readSlot } from "@/lib/pdec.ts"

type Props = {
  setSlot: (slot: SlotData, passphrase: string) => void
}

const PassphraseEntryForm = ({ setSlot }: Props) => {
  const [passphrase, setPassphrase] = useState("")
  const [errors, setErrors] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const result = validatePassphrase(passphrase)
    if (result.errors.length > 0) {
      setErrors(result.errors)
      return
    }
    setErrors([])
    setIsSubmitting(true)
    const slot = await readSlot(passphrase)
    setIsSubmitting(false)
    if (slot !== undefined) {
      setSlot(slot, passphrase)
    } else {
      setErrors(["Incorrect passphrase"])
    }
  }

  return (
    <form onSubmit={ handleSubmit }>
      <label htmlFor="passphrase">Passphrase:</label>
      <input
        id="passphrase"
        type="password"
        value={ passphrase }
        onChange={ event => setPassphrase(event.target.value) }
        placeholder="Passphrase"
      />
      <button type="submit" disabled={ isSubmitting }>{ isSubmitting ? "..." : "Submit" }</button>
      <ErrorDisplay errors={ errors } />
    </form>
  )
}

export default PassphraseEntryForm
