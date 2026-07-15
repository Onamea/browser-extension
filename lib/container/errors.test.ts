import { beforeEach, describe, expect, it } from "vitest"
import {
	ContainerError,
	ContainerChangedSinceSessionStartError,
	InvalidPasswordError,
	NoContainerExistsError,
	SessionEncryptionFailedError,
	SessionKeyUnwrapFailedError,
	SessionNotActiveError,
	StorageAPIUnavailableError,
	StorageReadFailedError,
	StorageWriteFailedError,
	StoredValueNotEncryptedContainerError,
	WrongPasswordOrCorruptedContainerError
} from "./errors.ts"
import { read } from "./storage.ts"

type StorageShape = {
	[storageKey: string]: unknown
}

type StubLocalStorage = {
	get: (key: string) => Promise<StorageShape>
	set: (items: StorageShape) => Promise<void>
}

const templateErrors: ContainerError[] = [
	StorageAPIUnavailableError,
	StorageReadFailedError,
	StorageWriteFailedError,
	StoredValueNotEncryptedContainerError,
	InvalidPasswordError,
	WrongPasswordOrCorruptedContainerError,
	SessionNotActiveError,
	NoContainerExistsError,
	ContainerChangedSinceSessionStartError,
	SessionKeyUnwrapFailedError,
	SessionEncryptionFailedError
]

beforeEach(() => {
	const g = globalThis as typeof globalThis & {
		chrome?: { storage?: { local?: StubLocalStorage } }
		browser?: { storage?: { local?: StubLocalStorage } }
	}

	g.chrome = {
		storage: {
			local: {
				get: (_key: string): Promise<StorageShape> => {
					return Promise.reject(new Error("forced get failure"))
				},
				set: (_items: StorageShape): Promise<void> => {
					return Promise.resolve()
				}
			}
		}
	}
	delete g.browser
})

describe("error templates", () => {
	it("exports frozen template errors", () => {
		for (const templateError of templateErrors) {
			expect(Object.isFrozen(templateError)).toBe(true)
		}
	})
})

describe("thrown container errors", () => {
	it("throws fresh instances instead of reusing templates", async () => {
		let firstError: unknown
		let secondError: unknown

		try {
			await read()
		} catch (error) {
			firstError = error
		}

		try {
			await read()
		} catch (error) {
			secondError = error
		}

		expect(firstError).toBeInstanceOf(ContainerError)
		expect(secondError).toBeInstanceOf(ContainerError)
		expect(firstError).not.toBe(secondError)
		expect(firstError).not.toBe(StorageReadFailedError)
		expect(secondError).not.toBe(StorageReadFailedError)
		expect(firstError).toMatchObject({ code: StorageReadFailedError.code })
		expect(secondError).toMatchObject({ code: StorageReadFailedError.code })
	})
})
