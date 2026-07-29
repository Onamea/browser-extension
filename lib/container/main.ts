import { create as createEncryptedContainer, isEncryptedContainer } from "./EncryptedContainer.ts"
import { parsePassword } from "./Password.ts"
import { type ActiveSession, type Session, invalidate, unlock, update } from "./Session.ts"
import { read, write } from "./storage.ts"
import { createWriteQueue } from "./utils/writeQueue.ts"
import { compareUint8Arrays } from "./utils/compareUint8Arrays.ts"
import { encode, decode } from "./utils/codec.ts"

export { isPassword } from "./Password.ts"
export type { ActiveSession, Session, InvalidatedSession } from "./Session.ts"
export type { AccessKey } from "./AccessKey.ts"

type Result = {
  hasContainer: boolean
  content: string | undefined
  accessKey: ActiveSession["accessKey"] | undefined
}

let session: Session | undefined = undefined
const enqueueWrite = createWriteQueue()

const getActiveSession = (): ActiveSession => {
  if (session === undefined || session.state !== "ACTIVE") {
    throw new Error("No active session")
  }
  return session
}

const assertAccessKey = (accessKey: string): void => {
  const currentSession = getActiveSession()
  if (accessKey !== currentSession.accessKey) {
    throw new Error("Invalid session key")
  }
}

export const checkStorage = async (): Promise<boolean> => {
  const result = await read()
  return result !== undefined
}

export const create = async (password: string): Promise<void> => {

  const parsedPassword = parsePassword(password)

  if (await checkStorage()) {
    throw new Error("Storage already exists")
  }

  const container = await createEncryptedContainer(parsedPassword)
  await write(container)
}

export const initialize = async (password: string): Promise<Result> => {

  const parsedPassword = parsePassword(password)

  if (session !== undefined) {
    throw new Error("Session already initialized")
  }

  const result = await read()
  if (result === undefined) {
    return { hasContainer: false, content: undefined, accessKey: undefined }
  }

  if (isEncryptedContainer(result) === false) {
    throw new Error("Storage corrupted: not an EncryptedContainer")
  }

  session = await unlock(result, parsedPassword)
  const content = decode(session.raw)

  return { hasContainer: true, content, accessKey: session.accessKey }
}

export const get = (accessKey: string): Promise<Result> => {
  try {
    const currentSession = getActiveSession()
    assertAccessKey(accessKey)
    return Promise.resolve({ hasContainer: true, content: decode(currentSession.raw), accessKey: currentSession.accessKey })
  } catch (error) {
    return Promise.reject(error)
  }
}

export const set = async (accessKey: string, content: string): Promise<void> => {

  const nextRaw = encode(content)

  const currentSession = getActiveSession()
  assertAccessKey(accessKey)
  if (compareUint8Arrays(currentSession.raw, nextRaw)) {
    throw new Error("Content is the same as the current content")
  }

  await enqueueWrite(async () => {
    const queuedSession = getActiveSession()
    assertAccessKey(accessKey)
    if (compareUint8Arrays(queuedSession.raw, nextRaw)) {
      throw new Error("Content is the same as the current content")
    }

    const updatedSession = await update(queuedSession, nextRaw)
    await write(updatedSession.container)
    session = updatedSession
  })
}

export const deinitialize = (): void => {
  if (session !== undefined) {
    invalidate(session)
    session = undefined
  }
}
