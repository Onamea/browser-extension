import { useState } from "react"

const SecretDisplay = ({ secret }: { secret: string }) => {

  const [isVisible, setIsVisible] = useState(false)

  const handleToggleVisibility = () => {
    setIsVisible(!isVisible)
  }

  return (
    <span onClick={ handleToggleVisibility }>{ isVisible ? secret : "•".repeat(secret.length) }</span>
  )
}

export default SecretDisplay
