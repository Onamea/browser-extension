import type { ExtensionState } from "../background/state.ts"
import ClearContainerButton from "../components/ClearContainerButton.tsx"
import ContainerDisplay from "../components/ContainerDisplay.tsx"
import useView from "../hooks/useView.tsx"

type Props = {
  state: ExtensionState
}

const Container = ({ state }: Props) => {

  const { showAccount } = useView()

  return (
    <>
      <ContainerDisplay container={ state.container } />
      <menu>
        <ClearContainerButton />
        <button type="button" onClick={ showAccount }>Cancel</button>
      </menu>
    </>
  )
}

export default Container
