import useExtensionState from "../hooks/useExtensionState.ts"

const SignOutButton = () => {

  const { signOut } = useExtensionState()

  const handleClick = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error("Failed to sign out: ", error)
    }
  }

  return <button type="button" onClick={ handleClick }>Sign Out</button>
}

export default SignOutButton
