import type { FormEvent } from "react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import ErrorDisplay from "./ErrorDisplay.tsx"
import MiningProgress from "./MiningProgress.tsx"
import useExtensionState from "@/lib/hooks/useExtensionState.ts"
import useCreateKeyPairMining from "@/lib/hooks/useCreateKeyPairMining.ts"

const CreateKeyPairForm = () => {

	const [name, setName] = useState("")
	const [shouldGenerateMnemonic, setShouldGenerateMnemonic] = useState(false)
	const navigate = useNavigate()
	const { writeData } = useExtensionState()
	const {
		isSubmitting,
		errors,
		progress,
		nameToMine,
		startMiningForNameInput
	} = useCreateKeyPairMining({
		writeData,
		onSuccess: async () => {
			await navigate("/account")
		}
	})

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		await startMiningForNameInput(name, shouldGenerateMnemonic)
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
				<div>
					<label htmlFor="shouldGenerateMnemonic">Generate mnemonic:</label>
					<input
						id="shouldGenerateMnemonic"
						type="checkbox"
						checked={ shouldGenerateMnemonic }
						onChange={ event => setShouldGenerateMnemonic(event.target.checked) }
						disabled={ isSubmitting }
					/>
				</div>
				{ progress !== undefined && nameToMine !== undefined && <MiningProgress nameLength={ nameToMine.length } totalAttempts={ progress.totalAttempts } /> }
				<button type="submit" disabled={ isSubmitting }>Generate</button>
				{ errors.length > 0 && <ErrorDisplay errors={ errors } /> }
			</form>
		</section>
	)
}

export default CreateKeyPairForm
