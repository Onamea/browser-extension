import { create as createEncryptedContainer, isEncryptedContainer } from "./EncryptedContainer.ts"
import { parsePassword } from "./Password.ts"
import { type Session, checkPassword, invalidate, unlock, update } from "./Session.ts"
import { read, write } from "./storage.ts"
import { isString } from "./utils/isString.ts"
import { createWriteQueue } from "./utils/writeQueue.ts"

export { isPassword } from "./Password.ts"

type Result = {
  hasContainer: boolean
  content: string | undefined
}

const defaultValidate = (content: string): boolean => {
  return isString(content)
}

let session: Session | undefined = undefined
let validate = defaultValidate
const enqueueWrite = createWriteQueue()

export const create = async (password: string): Promise<void> => {
  const parsedPassword = parsePassword(password)
  if (await checkStorage()) {
    throw new Error("Storage already exists")
  }
  const container = await createEncryptedContainer(parsedPassword)
  await write(container)
}

export const initialize = async (password: string, validateFn = defaultValidate): Promise<Result> => {

  const parsedPassword = parsePassword(password)

  if (session !== undefined) {
    throw new Error("Session already initialized")
  }

  validate = validateFn

  const result = await read()
  if (result === undefined) {
    return { hasContainer: false, content: undefined }
  }

  if (isEncryptedContainer(result) === false) {
    throw new Error("Storage corrupted: not an EncryptedContainer")
  }

  session = await unlock(result, parsedPassword)
  const content = session.decryptedContainer
  if (validate(content) === false) {
    session = undefined
    throw new Error("Storage corrupted: content validation failed")
  }
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
  return { hasContainer: true, content: session.decryptedContainer }
}

export const set = async (password: string, content: string): Promise<void> => {

  const parsedPassword = parsePassword(password)

  if (session === undefined || session.state !== "ACTIVE") {
    throw new Error("No active session")
  }
  if (await checkPassword(session, parsedPassword) === false) {
    throw new Error("Incorrect password")
  }
  if (session.decryptedContainer === content) {
    throw new Error("Content is the same as the current content")
  }
  if (validate(content) === false) {
    throw new Error("Content validation failed")
  }

  await enqueueWrite(async () => {
    const currentSession = session
    if (currentSession === undefined || currentSession.state !== "ACTIVE") {
      throw new Error("No active session")
    }
    if (currentSession.decryptedContainer === content) {
      throw new Error("Content is the same as the current content")
    }

    const updatedSession = await update(currentSession, content)
    await write(updatedSession.container)
    session = updatedSession
  })
}

export const deinitialize = (): void => {
  if (session !== undefined) {
    invalidate(session)
    session = undefined
  }
  validate = defaultValidate
}
