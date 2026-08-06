import useExtensionState from "../hooks/useExtensionState.ts"

const SignOutButton = () => {

	const { signOut } = useExtensionState()

	const handleClick = async () => {
		const isConfirmed = globalThis.confirm("Are you sure you want to sign out?")
		if (isConfirmed === false) return
		try {
			await signOut()
		} catch (error) {
			console.error("Failed to sign out: ", error)
		}
	}

	return <button type="button" onClick={ handleClick }>Sign Out</button>
}

export default SignOutButton
