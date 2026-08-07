import type { FormEvent } from "react"
import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
	type Name,
	type FingerprintDisplay,
	isName,
	isNameOrFingerprintedName,
	nameKeyToFingerprintedName,
	parseFingerprintedName
} from "@vanice/types"
import ErrorDisplay from "./ErrorDisplay.tsx"
import MiningProgress from "./MiningProgress.tsx"
import useExtensionState from "@/lib/hooks/useExtensionState.ts"
import { parseMiningResult } from "@/lib/types/MiningResult.ts"
import {
	MINING_ABORT,
	MINING_ERROR,
	MINING_PROGRESS,
	MINING_RESULT,
	MINING_START,
	isMiningErrorMessage,
	isMiningProgressMessage,
	isMiningResultMessage,
	type MiningMessage
} from "@/lib/messaging/mining.ts"

const CreateKeyPairForm = () => {

	const [name, setName] = useState("")
	const [nameToMine, setNameToMine] = useState<string>()
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [errors, setErrors] = useState<string[]>([])
	const [progress, setProgress] = useState<{ totalAttempts: number }>()
	const navigate = useNavigate()
	const { writeData } = useExtensionState()
  const activeRequestIdRef = useRef<string | undefined>(undefined)

	useEffect(() => {
		const listener = (message: unknown) => {
			if (isMiningProgressMessage(message) === false && isMiningErrorMessage(message) === false && isMiningResultMessage(message) === false) {
				return
			}

			const miningMessage = message as MiningMessage
			const activeRequestId = activeRequestIdRef.current
			if (activeRequestId === undefined || miningMessage.requestId !== activeRequestId) {
				return
			}

			if (miningMessage.type === MINING_PROGRESS) {
				setProgress({ totalAttempts: miningMessage.totalAttempts })
				return
			}

			if (miningMessage.type === MINING_ERROR) {
				activeRequestIdRef.current = undefined
				setErrors([miningMessage.error])
				setProgress(undefined)
				setIsSubmitting(false)
				return
			}

			if (miningMessage.type !== MINING_RESULT) {
				return
			}

			void (async () => {
				try {
					const { result } = miningMessage
					const { nameKey, cryptoName, publicKey, publicKeyDisplay, privateKey, privateKeyDisplay } = parseMiningResult(result)
					if (privateKey === undefined || privateKeyDisplay === undefined) {
						throw new Error("Mining timed out. Try a shorter name.")
					}

					const data = {
						nameKey,
						fingerprintedName: await nameKeyToFingerprintedName(nameKey),
						keyPair: {
							cryptoName,
							publicKey,
							publicKeyDisplay,
							privateKey,
							privateKeyDisplay
						}
					}

					const isSuccess = await writeData(data)
					if (isSuccess === false) {
						throw new Error("WRITE_DATA failed")
					}

					await navigate("/account")
				} catch (error) {
					setErrors([String(error)])
				} finally {
					activeRequestIdRef.current = undefined
					setProgress(undefined)
					setIsSubmitting(false)
				}
			})()
		}

		browser.runtime.onMessage.addListener(listener)
		return () => {
			browser.runtime.onMessage.removeListener(listener)
			if (activeRequestIdRef.current !== undefined) {
				void browser.runtime.sendMessage({
					type: MINING_ABORT,
					requestId: activeRequestIdRef.current
				})
			}
			activeRequestIdRef.current = undefined
		}
	}, [navigate, writeData])

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		setIsSubmitting(true)
		if (isNameOrFingerprintedName(name) === false) {
			setErrors(["Invalid name"])
			setIsSubmitting(false)
			return
		}
		setErrors([])

		let targetName: Name
		let fingerprintDisplay: FingerprintDisplay | undefined = undefined
		if (isName(name)) {
			targetName = name
		} else {
			[targetName, fingerprintDisplay] = parseFingerprintedName(name)
		}
		setNameToMine(targetName)

		try {
			const requestId = crypto.randomUUID()
			if (activeRequestIdRef.current !== undefined) {
				await browser.runtime.sendMessage({
					type: MINING_ABORT,
					requestId: activeRequestIdRef.current
				})
			}
			activeRequestIdRef.current = requestId
			const response = await browser.runtime.sendMessage({
				type: MINING_START,
				requestId,
				name: targetName,
				fingerprintDisplay
			}) as { ok?: boolean, error?: string }
			if (response?.error !== undefined) {
				activeRequestIdRef.current = undefined
				throw new Error(response.error)
			}
		} catch (error) {
			activeRequestIdRef.current = undefined
			setIsSubmitting(false)
			setErrors([String(error)])
		}
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
