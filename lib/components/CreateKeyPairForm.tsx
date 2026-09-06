import { type SubmitEvent, useCallback, useState } from "react"
import { isNameOrFingerprintedName } from "@onamea/types"
import ErrorDisplay from "./ErrorDisplay.tsx"
import MiningProgress from "./MiningProgress.tsx"
import useCreateKeyPairMining from "@/lib/hooks/useCreateKeyPairMining.ts"
import useHandleMiningResult from "@/lib/hooks/useHandleMiningResult.ts"
import { isSubKeyDomain } from "@onamea/crdt"

type Props = {
  forSubKey?: boolean
  allowForMnemonic?: boolean
}

const CreateKeyPairForm = ({ forSubKey = false, allowForMnemonic = false }: Props) => {

  const [name, setName] = useState("")
  const [shouldGenerateMnemonic, setShouldGenerateMnemonic] = useState(false)
  const [subKeyDomain, setSubKeyDomain] = useState("")
  const {
    isSubmitting,
    errors: miningErrors,
    progress,
    nameToMine,
    miningResult,
    startMiningForName,
  } = useCreateKeyPairMining()
  const [formErrors, setFormErrors] = useState<string[]>([])
  const resetValues = useCallback(() => {
    setName("")
    setShouldGenerateMnemonic(false)
    setSubKeyDomain("")
  }, [])
  const { errors: miningResultErrors } = useHandleMiningResult({
    miningResult,
    forSubKey,
    subKeyDomain,
    resetValues
  })
  const allErrors = [...formErrors, ...miningErrors, ...miningResultErrors]

  const handleSubmit = async (event: SubmitEvent) => {
    event.preventDefault()

    setFormErrors([])

    if (name.trim() === "") {
      setFormErrors(["Name cannot be empty"])
      return
    }

    if (isNameOrFingerprintedName(name) === false) {
      setFormErrors(["Invalid name"])
      return
    }

    if (subKeyDomain !== "") {
      if (isSubKeyDomain(subKeyDomain) === false) {
        setFormErrors(["Invalid subkey domain"])
        return
      }
    }

    await startMiningForName(name, shouldGenerateMnemonic)
  }

  return (
    <section>
      <form onSubmit={ handleSubmit }>
        <div>
          <label htmlFor="name">Choose a name:</label>
          <input
            id="name"
            type="text"
            value={ name }
            onChange={ event => setName(event.target.value) }
            disabled={ isSubmitting }
          />
        </div>
        { allowForMnemonic &&
          <div>
            <label>
              <input
                id="shouldGenerateMnemonic"
                type="checkbox"
                checked={ shouldGenerateMnemonic }
                onChange={ event => setShouldGenerateMnemonic(event.target.checked) }
                disabled={ isSubmitting }
              />
              Create Mnemonic
            </label>
          </div>
        }
        { forSubKey &&
          <div>
            <label htmlFor="subKeyDomain">Subkey domain:</label>
            <input
              id="subKeyDomain"
              type="text"
              value={ subKeyDomain }
              onChange={ event => setSubKeyDomain(event.target.value) }
              disabled={ isSubmitting }
            />
          </div>
        }
        { progress !== undefined && nameToMine !== undefined && <MiningProgress nameLength={ nameToMine.length } totalAttempts={ progress.totalAttempts } /> }
        <div style={{ marginTop: "8px" }}>
          <button type="submit" disabled={ isSubmitting }>Generate</button>
        </div>
        <ErrorDisplay errors={ allErrors } />
      </form>
    </section>
  )
}

export default CreateKeyPairForm
