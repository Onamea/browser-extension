import type { FormEvent } from "react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { type Name, type FingerprintDisplay, isName, isNameOrFingerprintedName, nameKeyToFingerprintedName, parseFingerprintedName } from "@vanice/types"
import { createWorkerPool } from "@vanice/vanice-pool"
import ErrorDisplay from "./ErrorDisplay.tsx"
import MiningProgress from "./MiningProgress.tsx"
import { useExtensionStateContext } from "@/lib/hooks/useExtensionStateContext.tsx"

const url = new URL("../../assets/workers/worker.js", import.meta.url)

const CreateKeyPairForm = () => {

	const [name, setName] = useState("")
	const [nameToMine, setNameToMine] = useState<string>()
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [errors, setErrors] = useState<string[]>([])
	const [progress, setProgress] = useState<{ totalAttempts: number }>()
	const navigate = useNavigate()
	const { writeData } = useExtensionStateContext()

	const onWorkerPoolStatusChange = ({ totalAttempts }: { totalAttempts: number }) => {
		setProgress({ totalAttempts })
	}

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		setIsSubmitting(true)
		if (isNameOrFingerprintedName(name) === false) {
			setErrors(["Invalid name"])
			setIsSubmitting(false)
			return
		}
		setErrors([])

		// name
		let nameToMine: Name
		let fingerprintDisplay: FingerprintDisplay | undefined = undefined
		if (isName(name)) {
			nameToMine = name
		} else {
			[nameToMine, fingerprintDisplay] = parseFingerprintedName(name)
		}
		setNameToMine(nameToMine)

		try {
			const { promise } = createWorkerPool("Ed25519", nameToMine, fingerprintDisplay, undefined, url, onWorkerPoolStatusChange)
			const result = await promise
			if (result !== undefined) {
				const data = {
					nameKey: result.nameKey,
					fingerprintedName: await nameKeyToFingerprintedName(result.nameKey),
					keyPair: {
						cryptoName: result.cryptoName,
						publicKey: result.publicKey,
						publicKeyDisplay: result.publicKeyDisplay,
						privateKey: result.privateKey!,
						privateKeyDisplay: result.privateKeyDisplay!
					}
				}
				const isSuccess = await writeData(data)
				if (isSuccess === false) {
					throw new Error("WRITE_DATA failed")
				}
				await navigate("/account")
			}
		} catch (error) {
			setErrors([String(error)])
		}
		setProgress(undefined)
		setIsSubmitting(false)
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
