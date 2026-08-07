import type { FormEvent } from "react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import ErrorDisplay from "./ErrorDisplay.tsx"
import MiningProgress from "./MiningProgress.tsx"
import useExtensionState from "@/lib/hooks/useExtensionState.ts"
import useCreateKeyPairMining from "@/lib/hooks/useCreateKeyPairMining.ts"

const CreateKeyPairForm = () => {

	const [name, setName] = useState("")
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
		await startMiningForNameInput(name)
	}

	return (
		<form onSubmit={ handleSubmit }>
			<div>
				<label htmlFor="name">Name:</label>
				<input
					id="name"
					type="text"
					value={ name }
					onChange={ event => setName(event.target.value) }
					placeholder="Name"
					disabled={ isSubmitting }
				/>
			</div>
			{ progress !== undefined && nameToMine !== undefined && <MiningProgress nameLength={ nameToMine.length } totalAttempts={ progress.totalAttempts } /> }
			<button type="submit" disabled={ isSubmitting }>Mine</button>
			{ errors.length > 0 && <ErrorDisplay errors={ errors } /> }
		</form>
	)
}

export default CreateKeyPairForm
