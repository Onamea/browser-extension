import { useExtensionStateContext } from "../hooks/useExtensionStateContext.ts"

const ClearContainerButton = () => {

	const { clearData } = useExtensionStateContext()

	const handleClick = async () => {
		const isConfirmed = globalThis.confirm("Are you sure you want to clear the Container?")
		if (isConfirmed === false) return
		try {
			await clearData()
		} catch (error) {
			console.error("Failed to clear container:", error)
		}
	}

	return <button type="button" onClick={ handleClick }>Clear Container</button>
}

export default ClearContainerButton
