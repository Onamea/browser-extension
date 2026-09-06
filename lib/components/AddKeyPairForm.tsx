import { type SubmitEvent, useState } from "react"
import { type Identifier, identify, isIdentifier } from "@onamea/crdt"
import { 
  type MnemonicDisplayWithPassphrase, 
  type PrivateKeyDisplay, 
  isMnemonicDisplayWithPassphrase, 
  isPrivateKeyDisplay,
  isNameKey
} from "@onamea/types"
import ErrorDisplay from "./ErrorDisplay.tsx"
import useExtensionState from "@/lib/hooks/useExtensionState.ts"

const AddKeyPairForm = () => {
  const [identifier, setIdentifier] = useState("")
  const [privateKeyOrMnemonic, setPrivateKeyOrMnemonic] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const { writeIdentity } = useExtensionState()

  const addKeyPair = async (identifier: Identifier, privateKeyOrMnemonic: PrivateKeyDisplay | MnemonicDisplayWithPassphrase) => {
    try {
      const [nameKey, keyPair] = await identify(identifier, privateKeyOrMnemonic)
      if (isNameKey(nameKey) === false) {
        throw new Error("Identifier is not a NameKey")
      }
      const data = await writeIdentity({ nameKey, keyPair })
      if (data === undefined) {
        throw new Error("WRITE_DATA failed")
      }
    } catch (error) {
      setErrors([`Failed to identify key pair: ${ String(error) }`])
    }
  }

  const handleSubmit = async (event: SubmitEvent) => {
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
    <section>
      <form onSubmit={ handleSubmit }>
        <div>
          <label htmlFor="identifier">Fingerprinted Name or NameKey:</label>
          <input
            id="identifier"
            type="text"
            value={ identifier }
            onChange={ event => setIdentifier(event.target.value) }
          />
        </div>
        <div>
          <label htmlFor="privateKeyOrMnemonic">Private key or mnemonic:</label>
          <input
            id="privateKeyOrMnemonic"
            type="password"
            value={ privateKeyOrMnemonic }
            onChange={ event => setPrivateKeyOrMnemonic(event.target.value) }
          />
        </div>
        <ErrorDisplay errors={ errors } />
        <button type="submit" disabled={ isSubmitting }>{ isSubmitting ? "..." : "Import" }</button>
      </form>
    </section>
  )
}

export default AddKeyPairForm
