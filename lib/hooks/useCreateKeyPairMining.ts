import { useCallback, useEffect, useRef, useState } from "react"
import type { FingerprintDisplay, Name } from "@vanice/types"
import { isName, isNameOrFingerprintedName, parseFingerprintedName } from "@vanice/types"
import { buildContainerDataFromMiningResult, type ContainerData } from "@/lib/types/ContainerData.ts"
import {
  abortMining,
  isMiningError,
  isMiningProgress,
  isMiningResult,
  type MiningMessageListener,
  onMiningMessage,
  startMining
} from "@/lib/messaging/client/miningClient.ts"

type UseCreateKeyPairMiningArgs = {
  writeData: (data: ContainerData) => Promise<boolean>
  onSuccess: () => Promise<void>
}

type UseCreateKeyPairMiningResult = {
  isSubmitting: boolean
  errors: string[]
  progress: { totalAttempts: number } | undefined
  nameToMine: string | undefined
  startMiningForNameInput: (nameInput: string) => Promise<void>
  cancelMining: () => Promise<void>
}

const useCreateKeyPairMining = ({ writeData, onSuccess }: UseCreateKeyPairMiningArgs): UseCreateKeyPairMiningResult => {
  const [nameToMine, setNameToMine] = useState<string>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [progress, setProgress] = useState<{ totalAttempts: number }>()

  const activeRequestIdRef = useRef<string | undefined>(undefined)
  const unsubscribeMiningRef = useRef<() => void>(() => {})
  const writeDataRef = useRef(writeData)
  const onSuccessRef = useRef(onSuccess)

  useEffect(() => {
    writeDataRef.current = writeData
  }, [writeData])

  useEffect(() => {
    onSuccessRef.current = onSuccess
  }, [onSuccess])

  const cancelMining = useCallback(async (): Promise<void> => {
    unsubscribeMiningRef.current()
    unsubscribeMiningRef.current = () => {}

    if (activeRequestIdRef.current !== undefined) {
      await abortMining(activeRequestIdRef.current)
    }

    activeRequestIdRef.current = undefined
  }, [])

  const handleMiningMessage: MiningMessageListener = miningMessage => {
    const activeRequestId = activeRequestIdRef.current
    if (activeRequestId === undefined || miningMessage.requestId !== activeRequestId) {
      return
    }

    if (isMiningProgress(miningMessage)) {
      setProgress({ totalAttempts: miningMessage.totalAttempts })
      return
    }

    if (isMiningError(miningMessage)) {
      activeRequestIdRef.current = undefined
      unsubscribeMiningRef.current()
      unsubscribeMiningRef.current = () => {}
      setErrors([miningMessage.error])
      setProgress(undefined)
      setIsSubmitting(false)
      return
    }

    if (isMiningResult(miningMessage) === false) {
      return
    }

    void (async () => {
      try {
        const data = await buildContainerDataFromMiningResult(miningMessage.result)
        const isSuccess = await writeDataRef.current(data)
        if (isSuccess === false) {
          throw new Error("WRITE_DATA failed")
        }

        await onSuccessRef.current()
      } catch (error) {
        setErrors([String(error)])
      } finally {
        activeRequestIdRef.current = undefined
        unsubscribeMiningRef.current()
        unsubscribeMiningRef.current = () => {}
        setProgress(undefined)
        setIsSubmitting(false)
      }
    })()
  }

  const startMiningForNameInput = async (nameInput: string): Promise<void> => {
    setIsSubmitting(true)

    if (isNameOrFingerprintedName(nameInput) === false) {
      setErrors(["Invalid name"])
      setIsSubmitting(false)
      return
    }

    setErrors([])

    let targetName: Name
    let fingerprintDisplay: FingerprintDisplay | undefined = undefined
    if (isName(nameInput)) {
      targetName = nameInput
    } else {
      [targetName, fingerprintDisplay] = parseFingerprintedName(nameInput)
    }
    setNameToMine(targetName)

    try {
      await cancelMining()

      const requestId = await startMining(targetName, fingerprintDisplay)
      activeRequestIdRef.current = requestId
      unsubscribeMiningRef.current = onMiningMessage(requestId, handleMiningMessage)
    } catch (error) {
      activeRequestIdRef.current = undefined
      unsubscribeMiningRef.current()
      unsubscribeMiningRef.current = () => {}
      setIsSubmitting(false)
      setErrors([String(error)])
    }
  }

  useEffect(() => {
    return () => {
      void cancelMining()
    }
  }, [cancelMining])

  return {
    isSubmitting,
    errors,
    progress,
    nameToMine,
    startMiningForNameInput,
    cancelMining
  }
}

export default useCreateKeyPairMining
