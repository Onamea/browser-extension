import useExtensionState from "../hooks/useExtensionState.ts"

const ClearContainerButton = () => {

  const { clearData } = useExtensionState()

  const handleClick = async () => {
    const isConfirmed = globalThis.confirm("Are you sure you want to clear your identity?")
    if (isConfirmed === false) return
    try {
      await clearData()
    } catch (error) {
      console.error("Failed to clear container:", error)
    }
  }

  return <button type="button" onClick={ handleClick }>Clear</button>
}

export default ClearContainerButton
