import type { ContainerData } from "../types/ContainerData.ts"
import ContainerDataEntryDisplay from "./ContainerDataEntryDisplay.tsx"

type Props = {
  data: ContainerData
}

const ContainerDataDisplay = ({ data }: Props) => {

  return (
    <div>
      { data.map(entry => (
        <div key={ entry.nameKey }>
          <ContainerDataEntryDisplay entry={ entry } />
          <hr />
        </div>
      )) }
    </div>
  )
}

export default ContainerDataDisplay
