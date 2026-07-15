export type DomainErrorDefinition = {
	code: number
	message: string
}

export class ContainerError extends Error {
	readonly code: number

	constructor(definition: DomainErrorDefinition) {
		super(definition.message)
		this.name = "ContainerError"
		this.code = definition.code
		Object.freeze(this)
	}
}

export const StorageAPIUnavailableError = new ContainerError({
	code: 1001,
	message: "Extension storage API is unavailable"
})

export const StorageReadFailedError = new ContainerError({
	code: 1002,
	message: "Failed to read from extension storage"
})

export const StorageWriteFailedError = new ContainerError({
	code: 1003,
	message: "Failed to write to extension storage"
})

export const StoredValueNotEncryptedContainerError = new ContainerError({
	code: 1101,
	message: "Stored value is not an EncryptedContainer"
})

export const InvalidPasswordError = new ContainerError({
	code: 2001,
	message: "Invalid password"
})

export const WrongPasswordOrCorruptedContainerError = new ContainerError({
	code: 2002,
	message: "Wrong password or corrupted container"
})

export const SessionNotActiveError = new ContainerError({
	code: 2101,
	message: "Session is not active"
})

export const NoContainerExistsError = new ContainerError({
	code: 2102,
	message: "No container exists"
})

export const ContainerChangedSinceSessionStartError = new ContainerError({
	code: 2103,
	message: "Container changed since session start"
})

export const SessionKeyUnwrapFailedError = new ContainerError({
	code: 2104,
	message: "Failed to unwrap session key"
})

export const SessionEncryptionFailedError = new ContainerError({
	code: 2105,
	message: "Failed to encrypt with session key"
})
