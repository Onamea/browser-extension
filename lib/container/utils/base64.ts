export const toBase64 = (bytes: Uint8Array): string => {
	let binary = ""
	for (const byte of bytes) {
		binary += String.fromCharCode(byte)
	}
	return btoa(binary)
}

export const fromBase64 = (value: string): Uint8Array => {
	const binary = atob(value)
	const bytes = new Uint8Array(binary.length)
	for (let i = 0; i < binary.length; i += 1) {
		bytes[i] = binary.charCodeAt(i)
	}
	return bytes
}

export const decodeBase64 = (value: string): Uint8Array | undefined => {
	try {
		return fromBase64(value)
	} catch (error) {
		void error
		return undefined
	}
}
