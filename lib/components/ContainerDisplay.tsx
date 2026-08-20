import type { ExtensionState } from "../background/state.ts"
import ContainerDataDisplay from "./ContainerDataDisplay.tsx"

type Props = {
  container: ExtensionState["container"]
}

const ContainerDisplay = ({ container }: Props) => {
  const { data, raw } = container

  return (
    <div>
      { data !== undefined 
        ? <ContainerDataDisplay data={ data } />
        : <p>
            { raw === undefined || raw === ""
              ? "You do not have an identity, yet. Please create or import one."
              : `Container contains invalid data (${ raw })`
            }
          </p>
      }
    </div>
  )
}

export default ContainerDisplay
