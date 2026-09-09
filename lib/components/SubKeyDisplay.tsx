import type { SubKey } from "@onamea/crdt"

type Props = {
  subKey: SubKey
}

const SubKeyDisplay = ({ subKey }: Props) => {
  const { id, displayName, domain } = subKey
  return <>{ displayName ?? id } ({ domain ?? "-" })</>
}

export default SubKeyDisplay
