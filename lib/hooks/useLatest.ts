import { useEffect, useRef } from "react"

const useLatest = <Value,>(value: Value) => {
  const valueRef = useRef(value)

  useEffect(() => {
    valueRef.current = value
  }, [value])

  return valueRef
}

export default useLatest
