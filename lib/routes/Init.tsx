import CreatePassphraseForm from "@/lib/components/CreatePassphraseForm.tsx"

type Props = {
  setData: (data: string, accessKey: string) => void
}

const Init = ({ setData }: Props) => {
  return (
    <div>
      <h1>Initialize</h1>
      <CreatePassphraseForm setData={ setData } />
    </div>
  )
}

export default Init
