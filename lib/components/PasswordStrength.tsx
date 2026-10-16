import type { CSSProperties } from "react"

type Props = {
  strength: [number, string | undefined]
}

const style: CSSProperties = { width: 316, marginBottom: 16 }
const spanStyle: CSSProperties = { float: "right" }

const PasswordStrength = ({ strength }: Props) => {
  const [value, display] = strength
  if (value === 0) return null
  const accentColor = value < 6 ? "red" : "green"
  const max = 10
  return (
    <div style={ style }>
      <progress value={ value } max={ max } style={{ accentColor }}></progress>
      { display !== undefined && <span style={ spanStyle }>{ display } / { max }</span> }
    </div>
  )
}

export default PasswordStrength
