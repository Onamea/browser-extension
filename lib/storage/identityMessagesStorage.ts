import type { IdentityWithMessages, Message, Messages } from "@onamea/crdt"
import { buildIdentityFromOperations, isCreateOperation, parseRawOperation } from "@onamea/crdt"
import { isNameKey, type NameKey } from "@onamea/types"

const STORAGE_KEY = "identityMessages.v0"

type LocalStorage = {
	get: (key: string) => Promise<Record<string, unknown>>
	set: (items: Record<string, unknown>) => Promise<void>
}

const getLocalStorage = (): LocalStorage => {
	const g = globalThis as typeof globalThis & {
		chrome?: { storage?: { local?: LocalStorage } }
		browser?: { storage?: { local?: LocalStorage } }
	}
	const localStorage = g.browser?.storage?.local ?? g.chrome?.storage?.local
	if (localStorage === undefined) {
		throw new Error("Extension storage API is unavailable")
	}

	return localStorage
}

const messagesIncludesMessage = (messages: Messages, message: Message): boolean => {
	return messages.some(({ raw }) => raw === message.raw)
}

export const getMessages = async (): Promise<Messages> => {
	const localStorage = getLocalStorage()
	try {
		const result = await localStorage.get(STORAGE_KEY)
		const messages = result[STORAGE_KEY]
		if (messages === undefined) {
			return []
		}
		if (!Array.isArray(messages)) {
			throw new Error("Invalid messages format in extension storage")
		}
		return messages as Messages
	} catch (_error) {
		throw new Error("Failed to read messages from extension storage")
	}
}

export const writeMessage = async (message: Message): Promise<void> => {
	const localStorage = getLocalStorage()
	try {
		const messages = await getMessages()
		if (messagesIncludesMessage(messages, message)) return
		await localStorage.set({ [STORAGE_KEY]: [...messages, message] })
	} catch (_error) {
		throw new Error("Failed to write message to extension storage")
	}
}

export const clearMessages = async (): Promise<void> => {
	const localStorage = getLocalStorage()
	try {
		await localStorage.set({ [STORAGE_KEY]: [] })
	} catch (_error) {
		throw new Error("Failed to clear messages from extension storage")
	}
}

export const getLocalStateFromMessages = async (): Promise<{ messages: Messages, identity: IdentityWithMessages | undefined }> => {
	const messages = await getMessages()
	const identity = await getIdentityFromMessages(messages)
	return {
		messages,
		identity
	}
}

export const getIdentityFromMessages = async (messages: Messages): Promise<IdentityWithMessages | undefined> => {
	if (messages.length === 0) {
		return undefined
	}

	const operations = await Promise.all(messages.map(async ({ raw }) => await parseRawOperation(raw)))
	const createOperations = operations.filter(operation => isCreateOperation(operation))
	const nameKey = createOperations.filter(({ id }) => isNameKey(id))[0]?.id as NameKey | undefined

	if (nameKey === undefined) {
		return undefined
	}

	const identityOperations = operations.filter(({ id }) => id === nameKey)

	const identity = await buildIdentityFromOperations(identityOperations, nameKey)
	return {
		...identity,
		messages
	}
}
