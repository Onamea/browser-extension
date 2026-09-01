import { useEffect, useState } from "react"
import { createGrantOperation, getRootOperation } from "@onamea/crdt"
import type { MiningResult } from "@/lib/types/MiningResult.ts"
import { buildContainerDataFromMiningResult } from "@/lib/types/ContainerData.ts"
import useExtensionState from "./useExtensionState.ts"

type UseHandleMiningResultParams = {
  miningResult: MiningResult | undefined
  forSubKey: boolean
  subKeyDomain: string
  resetValues: () => void
}

const useHandleMiningResult = ({
  miningResult,
  forSubKey,
  subKeyDomain,
  resetValues,
}: UseHandleMiningResultParams) => {
  const { state, writeData, appendOperation } = useExtensionState()
  const [errors, setErrors] = useState<string[]>([])

  useEffect(() => {
    if (miningResult === undefined) {
      return
    }

    setErrors([])

    void (async () => {
      try {
        if (forSubKey === true) {
          if (state.local.identity === undefined) {
            throw new Error("No Identity in state")
          }
          const id = state.local.identity.id
          const rootOperation = getRootOperation(id, state.local.identity.operations ?? [])
          if (rootOperation === undefined) {
            throw new Error("No root operation found for identity")
          }
          const grantOperation = await createGrantOperation(
            id,
            rootOperation?.hash,
            miningResult.nameKey,
            subKeyDomain !== "" ? subKeyDomain : undefined,
          )
          await appendOperation(grantOperation)
        } else {
          const data = await buildContainerDataFromMiningResult(miningResult)
          const isSuccess = await writeData(data)
          if (isSuccess === false) {
            throw new Error("Failed to write data")
          }
        }
        resetValues()
      } catch (error) {
        setErrors([String(error)])
      }
    })()
  }, [miningResult, forSubKey, subKeyDomain, writeData, appendOperation, resetValues, state.local.identity])

  return { errors }
}

export default useHandleMiningResult
