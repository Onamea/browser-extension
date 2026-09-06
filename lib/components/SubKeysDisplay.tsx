import type { ExtendedSubKey } from "../background/state.ts"

type Props = {
  subKeys: ExtendedSubKey[]
}

const SubKeysDisplay = ({ subKeys }: Props) => {
  return (
    <ul>
    { subKeys.map((subKey) => (
      <li key={ subKey.subKey }>{ subKey.fingerprintedName } ({ subKey.domain ?? "-" })</li>
    )) }
    </ul>
  )
}

export default SubKeysDisplay
