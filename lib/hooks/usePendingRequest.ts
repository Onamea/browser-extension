import { useCallback, useEffect, useState } from "react"
import type { PendingRequest } from "@/lib/background/signFlow.ts"
import { getPendingRequest } from "@/lib/messaging/client/apiClient.ts"

type UsePendingRequestResult = {
  pendingRequest: PendingRequest | undefined
  clearPendingRequest: () => void
  refreshPendingRequest: () => Promise<PendingRequest | undefined>
}

const usePendingRequest = (): UsePendingRequestResult => {
  const [pendingRequest, setPendingRequest] = useState<PendingRequest>()

  const refreshPendingRequest = useCallback(async () => {
    const pending = await getPendingRequest()
    setPendingRequest(pending)
    return pending
  }, [])

  const clearPendingRequest = () => {
    setPendingRequest(undefined)
  }

  useEffect(() => {
    refreshPendingRequest().catch(() => {})
  }, [])

  return {
    pendingRequest,
    clearPendingRequest,
    refreshPendingRequest
  }
}

export default usePendingRequest
