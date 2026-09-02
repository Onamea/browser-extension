import { useCallback, useEffect, useState } from "react"
import type { PendingRequest, SignRequestResult } from "@/lib/background/signFlow.ts"
import { getPendingRequest } from "@/lib/messaging/client/apiClient.ts"

type UsePendingRequestResult = {
  pendingRequest: PendingRequest | undefined
  signRequestResults: SignRequestResult[]
  clearPendingRequest: () => void
  clearSignRequestResults: () => void
  refreshPendingRequest: () => Promise<PendingRequest | undefined>
}

const usePendingRequest = (isUnlocked: boolean): UsePendingRequestResult => {
  const [pendingRequest, setPendingRequest] = useState<PendingRequest>()
  const [signRequestResults, setSignRequestResults] = useState<SignRequestResult[]>([])

  const refreshPendingRequest = useCallback(async () => {
    const response = await getPendingRequest()
    setPendingRequest(response.pendingRequest)
    setSignRequestResults(response.signRequestResults)
    return response.pendingRequest
  }, [])

  const clearPendingRequest = () => {
    setPendingRequest(undefined)
  }

  const clearSignRequestResults = () => {
    setSignRequestResults([])
  }

  useEffect(() => {
    if (isUnlocked === false) {
      return
    }

    refreshPendingRequest().catch(() => {})
  }, [isUnlocked, refreshPendingRequest])

  return {
    pendingRequest,
    signRequestResults,
    clearPendingRequest,
    clearSignRequestResults,
    refreshPendingRequest
  }
}

export default usePendingRequest
