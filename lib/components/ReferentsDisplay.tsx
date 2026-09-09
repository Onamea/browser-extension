import type { Referents } from "@onamea/crdt"

type Props = {
  referents: Referents
}

const ReferentsDisplay = ({ referents }: Props) => {
  return (
    <ul>
    { referents.map(({ id, displayName }) => (
      <li key={ id }>{ displayName ?? id }</li>
    )) }
    </ul>
  )
}

export default ReferentsDisplay
