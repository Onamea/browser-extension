import type { ExtensionState } from "../background/state.ts"
import ContainerDataDisplay from "./ContainerDataDisplay.tsx"

type Props = {
  state: ExtensionState
}

const ContainerDisplay = ({ state }: Props) => {

  return (
    <div>
      { state.data !== undefined 
        ? <ContainerDataDisplay data={ state.data } />
        : <p>
            { state.raw === undefined || state.raw === ""
              ? "Container is empty"
              : `Container contains invalid data (${ state.raw })`
            }
          </p>
      }
    </div>
  )
}

export default ContainerDisplay
