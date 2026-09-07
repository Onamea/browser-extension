import type { ExtendedSubKey } from "../background/state.ts"
import SubKeyDisplay from "./SubKeyDisplay.tsx"

type Props = {
  subKeys: ExtendedSubKey[]
}

const SubKeysDisplay = ({ subKeys }: Props) => {
  return (
    <ul>
    { subKeys.map(subKey => (
      <li key={ subKey.subKey }><SubKeyDisplay subKey={ subKey } /></li>
    )) }
    </ul>
  )
}

export default SubKeysDisplay
