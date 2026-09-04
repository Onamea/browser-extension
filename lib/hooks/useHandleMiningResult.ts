import { useEffect, useRef, useState } from "react"
import { createCreateOperation, createGrantOperation, getRootOperation } from "@onamea/crdt"
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
  const { state, writeIdentity, writeSubKey, signAndAppendOperation } = useExtensionState()
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
          if (state.container.data === undefined) {
            throw new Error("No Container Data in state")
          }

          const subKey = buildContainerDataEntryFromMiningResult(miningResult)
          const data = await writeSubKey(subKey)
          if (data === undefined) {
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
          await signAndAppendOperation(grantOperation, data.identity.keyPair)

        } else {
          const identity = buildContainerDataEntryFromMiningResult(miningResult)
          const data = await writeIdentity(identity)
          if (data === undefined) {
            throw new Error("Failed to write Identity to container")
          }

          const { nameKey, keyPair } = identity
          const createOperation = await createCreateOperation(nameKey)
          await signAndAppendOperation(createOperation, keyPair)
        }
        resetValues()
      } catch (error) {
        setErrors([String(error)])
      }
    })()
  }, [miningResult, forSubKey, subKeyDomain, writeIdentity, writeSubKey, signAndAppendOperation, resetValues, state.local.identity, state.container.data])

  return { errors }
}

export default useHandleMiningResult
