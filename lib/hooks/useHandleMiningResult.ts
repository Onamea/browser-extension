import { useEffect, useState } from "react"
import { createCreateOperation, createGrantOperation, getRootOperation, signOperation } from "@onamea/crdt"
import type { MiningResult } from "@/lib/types/MiningResult.ts"
import { buildContainerDataIdentityFromMiningResult, buildContainerDataSubKeyFromMiningResult } from "@/lib/types/ContainerData.ts"
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
  const { state, writeData, appendOperation, appendMessage } = useExtensionState()
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
          if (state.container.data === undefined) {
            throw new Error("No Container Data in state")
          }

          const data = buildContainerDataSubKeyFromMiningResult(state.container.data, miningResult)
          const isSuccess = await writeData(data)
          if (isSuccess === false) {
            throw new Error("Failed to write SubKey to container")
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
            subKeyDomain !== "" ? subKeyDomain : undefined
          )
          await appendOperation(grantOperation)
          
        } else {
          const data = buildContainerDataIdentityFromMiningResult(miningResult)
          const isSuccess = await writeData(data)
          if (isSuccess === false) {
            throw new Error("Failed to write Identity to container")
          }

          const { identity: { nameKey, keyPair } } = data
          const createOperation = await createCreateOperation(nameKey)
          const message = await signOperation(createOperation, keyPair, Date.now())
          await appendMessage(message)
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
