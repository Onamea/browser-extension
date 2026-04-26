import { useNavigate } from "react-router-dom"
import { SlotState } from "../background/state"
import SlotDisplay from "../components/SlotDisplay"

type Props = {
  slotState: SlotState
}

const Account = ({ slotState }: Props) => {

  const navigate = useNavigate()

  const onClick = async () => {
    navigate("/account/edit")
  }

  return (
    <>
      <SlotDisplay slotState={ slotState } />
      <button onClick={ onClick }>Edit</button>
    </>
  )
}

export default Account
