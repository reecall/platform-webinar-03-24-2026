export interface PendingTransfer {
  requestId: string
  destination: string
  callSid?: string
  conversationSummary?: string
  resolve: (result: TransferResult) => void
}

export interface TransferResult {
  accepted: boolean
  reason?: string
}

const pending = new Map<string, PendingTransfer>()

/** Store a pending transfer and return a promise that resolves when the call outcome is known. */
export function createPendingTransfer(
  requestId: string,
  destination: string,
  conversationSummary?: string,
  onCleanup?: () => void,
): Promise<TransferResult> {
  return new Promise<TransferResult>((resolve) => {
    pending.set(requestId, {
      requestId,
      destination,
      conversationSummary,
      resolve,
    })

    setTimeout(() => {
      const transfer = pending.get(requestId)
      if (transfer) {
        pending.delete(requestId)
        onCleanup?.()
        resolve({ accepted: false, reason: 'Transfer timed out — no response from destination.' })
      }
    }, 60_000)
  })
}

/** Called by Twilio status callback to set the callSid on the pending transfer. */
export function setCallSid(requestId: string, callSid: string): void {
  const transfer = pending.get(requestId)
  if (transfer) {
    transfer.callSid = callSid
  }
}

/** Resolve a pending transfer (called by Twilio status callback). */
export function resolveTransfer(requestId: string, result: TransferResult): void {
  const transfer = pending.get(requestId)
  if (transfer) {
    pending.delete(requestId)
    transfer.resolve(result)
  }
}

/** Look up a pending transfer by requestId. */
export function getPendingTransfer(requestId: string): PendingTransfer | undefined {
  return pending.get(requestId)
}
