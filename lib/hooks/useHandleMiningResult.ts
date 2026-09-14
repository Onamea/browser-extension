import { useEffect, useRef, useState } from "react"
import { createCreateOperation } from "@onamea/crdt"
import type { MiningResult } from "@/lib/types/MiningResult.ts"
import { buildContainerDataEntryFromMiningResult } from "@/lib/types/ContainerData.ts"
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
  const { state, writeEntry, createSignAndAppendOperation, signAndAppendOperation } = useExtensionState()
  const [errors, setErrors] = useState<string[]>([])
  const processedMiningResultRef = useRef<MiningResult>(undefined)

  useEffect(() => {
    if (miningResult === undefined) {
      return
    }

    // writing to the container updates state.container.data / state.local.identity,
    // which would otherwise re-trigger this effect for the same miningResult
    if (processedMiningResultRef.current === miningResult) {
      return
    }
    processedMiningResultRef.current = miningResult

    setErrors([])

    void (async () => {
      try {
        if (forSubKey === true) {
          if (state.local.identity === undefined) {
            throw new Error("No Identity in state")
          }
          const subKey = buildContainerDataEntryFromMiningResult(miningResult)
          const isWritten = await writeEntry(subKey)
          if (isWritten === false) {
            throw new Error("Failed to write SubKey to container")
          }
          const message = await createSignAndAppendOperation(
            state.local.identity,
            "GRANT",
            miningResult.nameKey,
            subKeyDomain !== "" ? subKeyDomain : undefined
          )
          if (message === undefined) {
            setErrors(["Failed to grant subKey"])
            return
          }

        } else {
          const identity = buildContainerDataEntryFromMiningResult(miningResult)
          const isWritten = await writeEntry(identity)
          if (isWritten === false) {
            setErrors(["Failed to write Identity to container"])
            return
          }

          const { nameKey } = identity
          const createOperation = await createCreateOperation(nameKey)
          await signAndAppendOperation(createOperation, nameKey)
        }
        resetValues()
      } catch (error) {
        setErrors([String(error)])
      }
    })()
  }, [miningResult, forSubKey, subKeyDomain, writeEntry, createSignAndAppendOperation, signAndAppendOperation, resetValues, state.local.identity])

  return { errors }
}

export default useHandleMiningResult
