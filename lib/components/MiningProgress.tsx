type Props = {
  nameLength: number
	totalAttempts: number
}

const MiningProgress = ({ nameLength, totalAttempts }: Props) => {

  const expectedAttempts = Math.pow(32, nameLength)
  const max = 1
  const progressValue = Math.min(totalAttempts / expectedAttempts, max)
  const style = progressValue === max ? { accentColor: "red" } : {}

	return (
    <div>
      <progress value={ progressValue } max={ max } style={ style } />
    </div>
	)
}

export default MiningProgress
