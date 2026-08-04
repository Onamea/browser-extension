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
import { useExtensionStateContext } from "@/lib/hooks/useExtensionStateContext.tsx"
import { isUnparsedMiningResult, parseMiningResult, type MiningResult } from "@/lib/types/MiningResult.ts"
import isObject from "../utils/isObject.ts"
import { isString } from "../container/utils/isString.ts"

type AbstractMiningMessage = {
	type: string
	requestId: string
}

type MiningProgressMessage = AbstractMiningMessage & {
	type: "MINING_PROGRESS"
	totalAttempts: number
}

type MiningResultMessage = AbstractMiningMessage & {
	type: "MINING_RESULT"
	result: MiningResult
}

type MiningErrorMessage = AbstractMiningMessage & {
	type: "MINING_ERROR"
	error: string
}

type MiningMessage = MiningProgressMessage | MiningResultMessage | MiningErrorMessage

const isAbstractMiningMessage = (message: unknown): message is AbstractMiningMessage => {
	if (isObject(message) === false) {
		return false
	}
	const candidate = message as { type?: unknown, requestId?: unknown }
	if (isString(candidate.type) === false || ["MINING_PROGRESS", "MINING_RESULT", "MINING_ERROR"].includes(candidate.type) === false) {
		return false
	}
	if (isString(candidate.requestId) === false) {
		return false
	}
	return true
}

const isMiningProgressMessage = (message: unknown): message is MiningProgressMessage => {
	if (isAbstractMiningMessage(message) === false) {
		return false
	}
	if (message.type !== "MINING_PROGRESS") {
		return false
	}
	const candidate = message as AbstractMiningMessage & { totalAttempts?: unknown }
	return typeof candidate.totalAttempts === "number"
}

const isMiningErrorMessage = (message: unknown): message is MiningErrorMessage => {
	if (isAbstractMiningMessage(message) === false) {
		return false
	}
	if (message.type !== "MINING_ERROR") {
		return false
	}
	const candidate = message as AbstractMiningMessage & { error?: unknown }
	return isString(candidate.error)
}

const isMiningResultMessage = (message: unknown): message is MiningResultMessage => {
	if (isAbstractMiningMessage(message) === false) {
		return false
	}
	if (message.type !== "MINING_RESULT") {
		return false
	}
	const candidate = message as AbstractMiningMessage & { result?: unknown }
	return isUnparsedMiningResult(candidate.result)
}

const CreateKeyPairForm = () => {

	const [name, setName] = useState("")
	const [nameToMine, setNameToMine] = useState<string>()
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [errors, setErrors] = useState<string[]>([])
	const [progress, setProgress] = useState<{ totalAttempts: number }>()
	const navigate = useNavigate()
	const { writeData } = useExtensionStateContext()
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

			if (miningMessage.type === "MINING_PROGRESS") {
				setProgress({ totalAttempts: miningMessage.totalAttempts })
				return
			}

			if (miningMessage.type === "MINING_ERROR") {
				activeRequestIdRef.current = undefined
				setErrors([miningMessage.error])
				setProgress(undefined)
				setIsSubmitting(false)
				return
			}

			if (miningMessage.type !== "MINING_RESULT") {
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
					type: "ABORT_MINING",
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
					type: "ABORT_MINING",
					requestId: activeRequestIdRef.current
				})
			}
			activeRequestIdRef.current = requestId
			const response = await browser.runtime.sendMessage({
				type: "START_MINING",
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
