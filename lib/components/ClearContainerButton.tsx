type Props = {
	onClear: () => Promise<void>
}

const ClearContainerButton = ({ onClear }: Props) => {

	const handleClick = async () => {
		const isConfirmed = globalThis.confirm("Are you sure you want to clear the Container?")
		if (isConfirmed === false) return
		try {
			await onClear()
		} catch (error) {
			console.error("Failed to clear container:", error)
		}
	}

	return <button type="button" onClick={ handleClick }>Clear Container</button>
}

export default ClearContainerButton
