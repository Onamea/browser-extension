type Props = {
	onClearSlot: () => Promise<void>
}

const ClearSlotButton = ({ onClearSlot }: Props) => {

	const handleClick = async () => {
		const isConfirmed = globalThis.confirm("Are you sure you want to clear the slot?")
		if (isConfirmed === false) return
		try {
			await onClearSlot()
		} catch (error) {
			console.error("Failed to clear slot:", error)
		}
	}

	return <button type="button" onClick={ handleClick }>Clear Slot</button>
}

export default ClearSlotButton
