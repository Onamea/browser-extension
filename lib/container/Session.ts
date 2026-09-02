import { type EncryptedContainer, clone } from "./EncryptedContainer.ts"
import { generateAccessKey } from "./AccessKey.ts"
import { type Password, parsePassword } from "./Password.ts"
import { GCM_IV_LENGTH, MASTER_KEY_LENGTH, PBKDF2_ITERATIONS } from "./constants.ts"
import { fromBase64, toBase64 } from "./utils/base64.ts"
import { getRandomBytes } from "./utils/getRandomBytes.ts"
import { toBufferSource } from "./utils/toBufferSource.ts"

export type SessionState = "ACTIVE" | "INVALIDATED"

export type ActiveSession = {
  state: Extract<SessionState, "ACTIVE">
  accessKey: string
  wrappingKey: CryptoKey
  wrappedMasterKey: ArrayBuffer
  wrappingIv: Uint8Array
  raw: Uint8Array
  container: EncryptedContainer
}

export type InvalidatedSession = {
  state: Extract<SessionState, "INVALIDATED">
}

export type Session = ActiveSession | InvalidatedSession

export { PBKDF2_ITERATIONS }

const encoder = new TextEncoder()
const deriveMasterKey = async (password: Password, salt: Uint8Array, extractable: boolean): Promise<CryptoKey> => {
  const passwordKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  )

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      iterations: PBKDF2_ITERATIONS,
      salt: toBufferSource(salt)
    },
    passwordKey,
    {
      name: "AES-GCM",
      length: MASTER_KEY_LENGTH
    },
    extractable,
    ["encrypt", "decrypt"]
  )
}

const decryptWithMasterKey = async (masterKey: CryptoKey, iv: Uint8Array, ciphertext: Uint8Array): Promise<Uint8Array> => {
  const plaintextBuffer = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: toBufferSource(iv)
    },
    masterKey,
    toBufferSource(ciphertext)
  )

  return new Uint8Array(plaintextBuffer)
}

const unwrapMasterKey = async (session: ActiveSession): Promise<CryptoKey> => {
  try {
    return await crypto.subtle.unwrapKey(
      "raw",
      session.wrappedMasterKey,
      session.wrappingKey,
      {
        name: "AES-GCM",
        iv: toBufferSource(session.wrappingIv)
      },
      {
        name: "AES-GCM",
        length: MASTER_KEY_LENGTH
      },
      false,
      ["encrypt", "decrypt"]
    )
  } catch (_error) {
    throw new Error("Failed to unwrap session key")
  }
}

const isActiveSession = (session: Session): session is ActiveSession => {
  return session.state === "ACTIVE"
}

const unlockContainer = async (container: EncryptedContainer, password: Password): Promise<ActiveSession> => {
  const salt = fromBase64(container.salt)
  const iv = fromBase64(container.iv)
  const ciphertext = fromBase64(container.ciphertext)
  const masterKey = await deriveMasterKey(password, salt, true)
  const raw = await decryptWithMasterKey(masterKey, iv, ciphertext)

  const accessKey = generateAccessKey()

  const wrappingKey = await crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: MASTER_KEY_LENGTH
    },
    false,
    ["wrapKey", "unwrapKey"]
  )
  const wrappingIv = getRandomBytes(GCM_IV_LENGTH)
  const wrappedMasterKey = await crypto.subtle.wrapKey(
    "raw",
    masterKey,
    wrappingKey,
    {
      name: "AES-GCM",
      iv: toBufferSource(wrappingIv)
    }
  )

  return {
    state: "ACTIVE",
    accessKey,
    wrappingKey,
    wrappedMasterKey,
    wrappingIv,
    raw,
    container: clone(container)
  }
}

const encryptWithSession = async (session: ActiveSession, plaintext: Uint8Array): Promise<EncryptedContainer> => {
  const masterKey = await unwrapMasterKey(session)
  const iv = getRandomBytes(GCM_IV_LENGTH)

  const ciphertextBuffer = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: toBufferSource(iv)
    },
    masterKey,
    toBufferSource(plaintext)
  )

  return {
    salt: session.container.salt,
    iv: toBase64(iv),
    ciphertext: toBase64(new Uint8Array(ciphertextBuffer)),
    version: session.container.version
  }
}

export const unlock = async (container: EncryptedContainer, password: string): Promise<ActiveSession> => {
  let parsedPassword: Password
  try {
    parsedPassword = parsePassword(password)
  } catch (_error) {
    throw new Error("Invalid password")
  }

  try {
    return await unlockContainer(container, parsedPassword)
  } catch (_error) {
    // Map crypto errors to meaningful domain error
    throw new Error("Wrong password or corrupted container")
  }
}

export const checkPassword = async (session: ActiveSession, password: string): Promise<boolean> => {
  try {
    await unlock(session.container, password)
    return true
  } catch {
    return false
  }
}

export const update = async (session: ActiveSession, raw: Uint8Array): Promise<ActiveSession> => {
  const encryptedContainer = await encryptWithSession(session, raw)
  return {
    ...session,
    container: encryptedContainer,
    raw
  }
}

export const invalidate = (session: Session): InvalidatedSession => {
  if (isActiveSession(session) === false) {
    return session
  }

  session.wrappedMasterKey = new ArrayBuffer(0)
  session.wrappingIv = new Uint8Array(0)
  session.raw.fill(0)
  session.raw = new Uint8Array(0)

  const mutableSession = session as Record<string, unknown>
  Reflect.deleteProperty(mutableSession, "accessKey")
  Reflect.deleteProperty(mutableSession, "wrappingKey")
  Reflect.deleteProperty(mutableSession, "wrappedMasterKey")
  Reflect.deleteProperty(mutableSession, "wrappingIv")
  Reflect.deleteProperty(mutableSession, "container")
  Reflect.deleteProperty(mutableSession, "raw")
  mutableSession.state = "INVALIDATED"

  return session as unknown as InvalidatedSession
}
