import { useNavigate } from "react-router-dom"
import type { SlotState } from "../background/state.ts"
import SlotDisplay from "../components/SlotDisplay.tsx"

type Props = {
  slotState: SlotState
}

const Account = ({ slotState }: Props) => {

  const navigate = useNavigate()

  const onClick = () => {
    navigate("/account/edit")
  }

  return (
    <>
      <SlotDisplay slotState={ slotState } />
      <button type="button" onClick={ onClick }>Edit</button>
    </>
  )
}

export default Account
