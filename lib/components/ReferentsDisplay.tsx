import type { ExtendedReferent } from "../background/state.ts"

type Props = {
  referents: ExtendedReferent[]
}

const ReferentsDisplay = ({ referents }: Props) => {
  return (
    <ul>
    { referents.map(({ id, fingerprintedName }) => (
      <li key={ id }>{ fingerprintedName }</li>
    )) }
    </ul>
  )
}

export default ReferentsDisplay
