import { create as createEncryptedContainer, isEncryptedContainer } from "./EncryptedContainer.ts"
import { parsePassword } from "./Password.ts"
import { type Session, checkPassword, invalidate, unlock, update } from "./Session.ts"
import { read, write } from "./storage.ts"
import { createWriteQueue } from "./utils/writeQueue.ts"
import { compareUint8Arrays } from "./utils/compareUint8Arrays.ts"
import { encode, decode } from "./utils/codec.ts"

export { isPassword } from "./Password.ts"

type Result = {
  hasContainer: boolean
  content: string | undefined
}

let session: Session | undefined = undefined
const enqueueWrite = createWriteQueue()

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
    return { hasContainer: false, content: undefined }
  }

  if (isEncryptedContainer(result) === false) {
    throw new Error("Storage corrupted: not an EncryptedContainer")
  }

  session = await unlock(result, parsedPassword)
  const content = decode(session.raw)

  return { hasContainer: true, content }
}

export const checkStorage = async (): Promise<boolean> => {
  const result = await read()
  return result !== undefined
}

export const get = async (password: string): Promise<Result> => {

  const parsedPassword = parsePassword(password)

  if (session === undefined || session.state !== "ACTIVE") {
    throw new Error("No active session")
  }
  if (await checkPassword(session, parsedPassword) === false) {
    throw new Error("Incorrect password")
  }
  return { hasContainer: true, content: decode(session.raw) }
}

export const set = async (password: string, content: string): Promise<void> => {

  const parsedPassword = parsePassword(password)

  const nextRaw = encode(content)

  if (session === undefined || session.state !== "ACTIVE") {
    throw new Error("No active session")
  }
  if (await checkPassword(session, parsedPassword) === false) {
    throw new Error("Incorrect password")
  }
  if (compareUint8Arrays(session.raw, nextRaw)) {
    throw new Error("Content is the same as the current content")
  }

  await enqueueWrite(async () => {
    const currentSession = session
    if (currentSession === undefined || currentSession.state !== "ACTIVE") {
      throw new Error("No active session")
    }
    if (compareUint8Arrays(currentSession.raw, nextRaw)) {
      throw new Error("Content is the same as the current content")
    }

    const updatedSession = await update(currentSession, nextRaw)
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
