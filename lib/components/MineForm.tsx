import type { FormEvent } from "react"
import { useState } from "react"
import ErrorDisplay from "./ErrorDisplay.tsx"
import { isName } from "@vanice/types"

type Props = {
	onSubmit: (name: string) => Promise<void>
}

const MineForm = ({ onSubmit }: Props) => {
	const [name, setName] = useState("")
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [errors, setErrors] = useState<string[]>([])

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		setIsSubmitting(true)
		if (isName(name) === false) {
			setErrors(["Invalid name"])
			setIsSubmitting(false)
			return
		}
		setErrors([])
		await onSubmit(name)
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
			<button type="submit" disabled={ isSubmitting }>Mine</button>
			{ errors.length > 0 && <ErrorDisplay errors={ errors } /> }
		</form>
	)
}

export default MineForm
