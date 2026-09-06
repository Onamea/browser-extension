import type { ContainerData } from "../types/ContainerData.ts"
import ContainerDataEntryDisplay from "./ContainerDataEntryDisplay.tsx"

type Props = {
  data: ContainerData
}

const ContainerDataDisplay = ({ data }: Props) => {

  const { identity, subKeys } = data

  return (
    <div>
      <h3>Identity</h3>
      <ContainerDataEntryDisplay entry={ identity } />
      <hr />
      <h3>SubKeys</h3>
      { subKeys.map(subKey => (
        <div key={ subKey.nameKey }>
          <ContainerDataEntryDisplay entry={ subKey } />
          <hr />
        </div>
      )) }
    </div>
  )
}

export default ContainerDataDisplay
