import { CONTAINER_STORAGE_KEY } from "./constants.ts"
import type { EncryptedContainer } from "./EncryptedContainer.ts"
import { StorageAPIUnavailableError, StorageReadFailedError, StorageWriteFailedError } from "./errors.ts"

export { CONTAINER_STORAGE_KEY }

type LocalStorage = {
	get: (key: string) => Promise<Record<string, unknown>>
	set: (items: Record<string, unknown>) => Promise<void>
}

const getLocalStorage = (): LocalStorage => {
	const g = globalThis as typeof globalThis & {
		chrome?: { storage?: { local?: LocalStorage } }
		browser?: { storage?: { local?: LocalStorage } }
	}
	const localStorage = g.chrome?.storage?.local ?? g.browser?.storage?.local
	if (localStorage === undefined) {
		throw StorageAPIUnavailableError
	}

	return localStorage
}

export const read = async (): Promise<unknown> => {
	const localStorage = getLocalStorage()

	try {
		const stored = await localStorage.get(CONTAINER_STORAGE_KEY)
		return stored[CONTAINER_STORAGE_KEY]
	} catch (error) {
		void error
		throw StorageReadFailedError
	}
}

export const write = async (container: EncryptedContainer): Promise<void> => {
	const localStorage = getLocalStorage()

	try {
		await localStorage.set({ [CONTAINER_STORAGE_KEY]: container })
	} catch (error) {
		void error
		throw StorageWriteFailedError
	}
}
