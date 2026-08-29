import AddKeyPairForm from "@/lib/components/AddKeyPairForm.tsx"
import CreateKeyPairForm from "../components/CreateKeyPairForm.tsx"
import SignOutButton from "../components/SignOutButton.tsx"

const AccountCreate = () => {

  return (
    <div>
      <CreateKeyPairForm />
      <AddKeyPairForm />
      <menu>
        <SignOutButton />
      </menu>
    </div>
  )
}

export default AccountCreate
