import { useCallback, useEffect, useRef, useState } from "react"
import type { FingerprintDisplay, Name, NameOrFingerprintedName } from "@onamea/types"
import { isName, parseFingerprintedName } from "@onamea/types"
import type { UnparsedMiningResult } from "@/lib/types/MiningResult.ts"
import {
  type MiningMessageListener,
  abortMining,
  isMiningError,
  isMiningProgress,
  isMiningResult,
  onMiningMessage,
  startMining
} from "@/lib/messaging/client/miningClient.ts"

type UseCreateKeyPairMiningResult = {
  isSubmitting: boolean
  errors: string[]
  progress: { totalAttempts: number } | undefined
  nameToMine: string | undefined
  miningResult: UnparsedMiningResult | undefined
  startMiningForName: (name: NameOrFingerprintedName, shouldGenerateMnemonic?: boolean) => Promise<void>
  cancelMining: () => Promise<void>
}

const useCreateKeyPairMining = (): UseCreateKeyPairMiningResult => {
  const [nameToMine, setNameToMine] = useState<string>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [progress, setProgress] = useState<{ totalAttempts: number }>()
  const [miningResult, setMiningResult] = useState<UnparsedMiningResult>()

  const activeRequestIdRef = useRef<string | undefined>(undefined)
  const unsubscribeMiningRef = useRef<() => void>(() => {})

  const cleanupMining = (): void => {
    activeRequestIdRef.current = undefined
    unsubscribeMiningRef.current()
    unsubscribeMiningRef.current = () => {}
  }

  const cancelMining = useCallback(async (): Promise<void> => {
    if (activeRequestIdRef.current !== undefined) {
      await abortMining(activeRequestIdRef.current)
    }

    cleanupMining()
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
      cleanupMining()
      setErrors([miningMessage.error])
      setProgress(undefined)
      setIsSubmitting(false)
      return
    }

    if (isMiningResult(miningMessage) === false) {
      return
    }

    void (() => {
      try {
        const result = miningMessage.result as UnparsedMiningResult
        setMiningResult(result)
      } catch (error) {
        setErrors([String(error)])
      } finally {
        cleanupMining()
        setProgress(undefined)
        setIsSubmitting(false)
      }
    })()
  }

  const startMiningForName = async (name: NameOrFingerprintedName, shouldGenerateMnemonic?: boolean): Promise<void> => {
    setIsSubmitting(true)

    setErrors([])
    setMiningResult(undefined)

    let targetName: Name
    let fingerprintDisplay: FingerprintDisplay | undefined = undefined
    if (isName(name)) {
      targetName = name
    } else {
      [targetName, fingerprintDisplay] = parseFingerprintedName(name)
    }
    setNameToMine(targetName)

    try {
      await cancelMining()

      const requestId = await startMining(targetName, fingerprintDisplay, shouldGenerateMnemonic)
      activeRequestIdRef.current = requestId
      unsubscribeMiningRef.current = onMiningMessage(requestId, handleMiningMessage)
    } catch (error) {
      cleanupMining()
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
    miningResult,
    startMiningForName,
    cancelMining
  }
}

export default useCreateKeyPairMining
