import type { SlotData } from "@mikeobank/pdec"
import { displayKeyPair, parseKeyPairAsJSON } from "@vanice/types"

type Props = {
  slot: SlotData
}

const displaySlotData = (data: SlotData["data"]): string => {
  const str = new TextDecoder().decode(data)
  try {
    const json = JSON.parse(str)
    const { nameKey, fingerprintedName } = json
    const keyPair = parseKeyPairAsJSON(json.keyPair)
    const keyPairDisplay = displayKeyPair(keyPair)
    const { cryptoName, publicKeyDisplay, privateKeyDisplay } = keyPairDisplay
    return JSON.stringify({ nameKey, fingerprintedName, keyPair: { cryptoName, publicKeyDisplay, privateKeyDisplay } }, null, 2)
  } catch (_) {
    //console.error(error)
    return str
  }
}

const SlotDisplay = ({ slot }: Props) => {

  return (
    <div>
      <pre>{ displaySlotData(slot.data) }</pre>
    </div>
  )
}

export default SlotDisplay
