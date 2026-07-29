import type { FormEvent } from "react"
import { useState } from "react"
import type { Identifier } from "@vanice/crdt"
import { identify, isIdentifier } from "@vanice/crdt"
import { 
  type MnemonicDisplayWithPassphrase, 
  type PrivateKeyDisplay, 
  isMnemonicDisplayWithPassphrase, 
  isPrivateKeyDisplay,
  isNameKey,
  nameKeyToFingerprintedName
} from "@vanice/types"
import { encodeSessionData } from "@/lib/container.ts"
import ErrorDisplay from "./ErrorDisplay.tsx"

type Props = {
  setData: (data: string) => Promise<void>
}

const AddKeyPairForm = ({ setData }: Props) => {
  const [identifier, setIdentifier] = useState("")
  const [privateKeyOrMnemonic, setPrivateKeyOrMnemonic] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  const addKeyPair = async (identifier: Identifier, privateKeyOrMnemonic: PrivateKeyDisplay | MnemonicDisplayWithPassphrase) => {
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
        { type: "WRITE_DATA", data }
      )
      if (response.data === undefined) {
        throw new Error(response.error ?? "WRITE_DATA failed")
      }
      await setData(encodeSessionData(data))
    } catch (error) {
      setErrors([`Failed to identify key pair: ${ String(error) }`])
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
    await addKeyPair(identifier, privateKeyOrMnemonic)
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
      <ErrorDisplay errors={ errors } />
      <button type="submit" disabled={ isSubmitting }>{ isSubmitting ? "..." : "Add" }</button>
    </form>
  )
}

export default AddKeyPairForm
