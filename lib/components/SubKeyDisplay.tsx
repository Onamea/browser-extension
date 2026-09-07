import type { ExtendedSubKey } from "../background/state.ts"

type Props = {
  subKey: ExtendedSubKey
}

const SubKeyDisplay = ({ subKey }: Props) => {
  const { fingerprintedName, domain } = subKey
  return <>{ fingerprintedName } ({ domain ?? "-" })</>
}

export default SubKeyDisplay
