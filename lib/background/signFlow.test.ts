import { describe, expect, it, vi } from "vitest"

const loadSignFlow = async () => {
	vi.resetModules()
	return await import("./signFlow.ts")
}

describe("signFlow queueing", () => {
	it("queues concurrent sign requests and promotes the next request after confirm", async () => {
		const { getPendingRequest, handleConfirmSign, handleSign } = await loadSignFlow()
		const openPopup = vi.fn()
		const firstSendResponse = vi.fn()
		const secondSendResponse = vi.fn()
		const popupSendResponse = vi.fn()

		expect(handleSign("first", "request-1", "https://example.com", firstSendResponse, openPopup)).toBe(true)
		expect(handleSign("second", "request-2", "https://example.com", secondSendResponse, openPopup)).toBe(true)
		expect(openPopup).toHaveBeenCalledTimes(1)
		expect(getPendingRequest()?.requestId).toBe("request-1")

		expect(handleConfirmSign({ data: { keyPair: {} } } as never, popupSendResponse)).toBe(false)

		expect(popupSendResponse).toHaveBeenCalledWith({ ok: true })
		expect(firstSendResponse).toHaveBeenCalledWith({ error: "Data is not a valid Operation", requestId: "request-1" })
		expect(getPendingRequest()?.requestId).toBe("request-2")
	})

	it("rejects requests when the pending queue reaches its maximum length", async () => {
		const { handleSign } = await loadSignFlow()
		const openPopup = vi.fn()
		const sendResponses: Array<(response: unknown) => void> = Array.from({ length: 9 }, () => vi.fn())

		for (let index = 0; index < 8; index++) {
			expect(
				handleSign(
					`data-${ index }`,
					`request-${ index }`,
					"https://example.com",
					sendResponses[index]!,
					openPopup
				)
			).toBe(true)
		}

		expect(handleSign("data-8", "request-8", "https://example.com", sendResponses[8]!, openPopup)).toBe(false)
		expect(sendResponses[8]).toHaveBeenCalledWith({ error: "Too many pending sign requests", requestId: "request-8" })
		expect(openPopup).toHaveBeenCalledTimes(1)
	})
})
