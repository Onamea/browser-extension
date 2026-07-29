import PassphraseEntryForm from "@/lib/components/PassphraseEntryForm.tsx"

type Props = {
  setData: (data: string, accessKey: string) => void
}

const Signin = ({ setData }: Props) => {
  return (
    <div>
      <h1>Sign in</h1>
      <PassphraseEntryForm setData={ setData } />
    </div>
  )
}

export default Signin
