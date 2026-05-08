import type { FormEvent } from "react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { type Name, type FingerprintDisplay, isName, isNameOrFingerprintedName, nameKeyToFingerprintedName, parseFingerprintedName } from "@vanice/types"
import { createWorkerPool } from "@vanice/vanice-pool"
import ErrorDisplay from "./ErrorDisplay.tsx"
import type { SlotData } from "../pdec.ts"
import MiningProgress from "./MiningProgress.tsx"

type Props = {
	setSlot: (slot: SlotData) => Promise<void>
}

const url = new URL("../../assets/workers/worker.js", import.meta.url)

const CreateKeyPairForm = ({ setSlot }: Props) => {
	const [name, setName] = useState("")
	const [nameToMine, setNameToMine] = useState<string>()
	const [passphrase, setPassphrase] = useState("")
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [errors, setErrors] = useState<string[]>([])
	const [progress, setProgress] = useState<{ totalAttempts: number }>()
	const navigate = useNavigate()

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
						privateKey: result.privateKey,
						privateKeyDisplay: result.privateKeyDisplay
					}
				}
				const response = await browser.runtime.sendMessage(
					{ type: "WRITE_SLOT", data, passphrase }
				)
				if (response.slot === undefined) {
					throw new Error(response.error ?? "WRITE_SLOT failed")
				}
				await setSlot(response.slot)
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
			{ progress !== undefined && nameToMine !== undefined && <MiningProgress nameLength={ nameToMine.length } totalAttempts={ progress.totalAttempts } /> }
			<button type="submit" disabled={ isSubmitting }>Mine</button>
			{ errors.length > 0 && <ErrorDisplay errors={ errors } /> }
		</form>
	)
}

export default CreateKeyPairForm
