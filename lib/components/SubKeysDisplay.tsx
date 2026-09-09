import type { SubKeys } from "@onamea/crdt"
import SubKeyDisplay from "./SubKeyDisplay.tsx"

type Props = {
  subKeys: SubKeys
}

const SubKeysDisplay = ({ subKeys }: Props) => {
  return (
    <ul>
    { subKeys.map(subKey => (
      <li key={ subKey.id }><SubKeyDisplay subKey={ subKey } /></li>
    )) }
    </ul>
  )
}

export default SubKeysDisplay
