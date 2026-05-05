import type { FormEvent } from "react"
import type { Identifier } from "@vanice/crdt"
import { identify } from "@vanice/crdt"
import { useState } from "react"
import ErrorDisplay from "./ErrorDisplay.tsx"
import { 
  type MnemonicDisplayWithPassphrase, 
  type PrivateKeyDisplay, 
  isMnemonicDisplayWithPassphrase, 
  isPrivateKeyDisplay,
  isNameKey,
  nameKeyToFingerprintedName
} from "@vanice/types"
import { isIdentifier } from "@vanice/crdt"
import type { SlotData } from "../pdec.ts"

type Props = {
  setSlot: (slot: SlotData) => Promise<void>
}

const AddKeyPairForm = ({ setSlot }: Props) => {
  const [identifier, setIdentifier] = useState("")
  const [privateKeyOrMnemonic, setPrivateKeyOrMnemonic] = useState("")
  const [passphrase, setPassphrase] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  const addKeyPair = async (identifier: Identifier, privateKeyOrMnemonic: PrivateKeyDisplay | MnemonicDisplayWithPassphrase, passphrase: string) => {
    try {
      const [nameKey, keyPair] = await identify(identifier, privateKeyOrMnemonic)
      if (isNameKey(nameKey) === false) {
        throw new Error("Identifier is not a NameKey")
      }
      const fingerprintedName = await nameKeyToFingerprintedName(nameKey)
      const data = {
        nameKey,
        fingerprintedName,
        keyPair
      }
      const response = await browser.runtime.sendMessage(
        { type: "WRITE_SLOT", data, passphrase }
      )
      if (response.slot === undefined) {
        throw new Error(response.error ?? "WRITE_SLOT failed")
      }
      await setSlot(response.slot)
    } catch (error) {
      console.error("Failed to identify key pair:", error)
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    if (!isIdentifier(identifier)) {
      setErrors(["Invalid Identifier"])
      setIsSubmitting(false)
      return
    }
    if ((isPrivateKeyDisplay(privateKeyOrMnemonic) || isMnemonicDisplayWithPassphrase(privateKeyOrMnemonic)) === false) {
      setErrors(["Invalid PrivateKeyDisplay and MnemonicDisplayWithPassphrase"])
      setIsSubmitting(false)
      return
    }
    await addKeyPair(identifier, privateKeyOrMnemonic, passphrase)
    setIsSubmitting(false)
  }

  return (
    <form onSubmit={ handleSubmit }>
      <div>
        <label htmlFor="identifier">Identifier:</label>
        <input
          id="identifier"
          type="text"
          value={ identifier }
          onChange={ event => setIdentifier(event.target.value) }
          placeholder="Identifier"
        />
      </div>
      <div>
        <label htmlFor="privateKeyOrMnemonic">Private key or mnemonic:</label>
        <input
          id="privateKeyOrMnemonic"
          type="password"
          value={ privateKeyOrMnemonic }
          onChange={ event => setPrivateKeyOrMnemonic(event.target.value) }
          placeholder="Private key or mnemonic"
        />
      </div>
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
      <ErrorDisplay errors={ errors } />
      <button type="submit" disabled={ isSubmitting }>{ isSubmitting ? "..." : "Add" }</button>
    </form>
  )
}

export default AddKeyPairForm
