import ErrorDisplay from "./ErrorDisplay.tsx"

const OutOfSyncErrorDisplay = () => {
  return <ErrorDisplay errors={ ["Local and container data are out of sync"] } /> 
}

export default OutOfSyncErrorDisplay
