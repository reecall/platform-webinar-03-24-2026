import { FastifyInstance } from 'fastify'
import { initiateTransferCall } from '../services/twilio.js'
import { createPendingTransfer, setCallSid, resolveTransfer } from '../services/transfer-store.js'
import { createBridge, removeBridge } from '../services/audio-bridge.js'

interface TransferRequestBody {
  requestId: string
  destination: string
  conversationSummary?: string
}

export function registerTransfers(app: FastifyInstance) {
  /**
   * POST /api/transfers
   *
   * Called by the frontend when the Reecall Agent sends a RequestTransfer RPC.
   * 1. Creates a pending transfer in the store
   * 2. Initiates a Twilio outbound call
   * 3. Waits for the Twilio status callback to resolve the transfer
   * 4. Returns { accepted, reason? } to the frontend
   *
   * This is a long-polling endpoint — blocks until the call outcome is known (up to ~60s).
   */
  app.post<{ Body: TransferRequestBody }>('/api/transfers', async (request, reply) => {
    const { requestId, destination, conversationSummary } = request.body

    if (!requestId || !destination) {
      return reply.status(400).send({ error: 'requestId and destination are required' })
    }

    request.log.info({ requestId, destination }, 'Transfer requested')

    // 0. Create audio bridge early so the frontend WebSocket can connect immediately
    createBridge(requestId)

    // 1. Create pending transfer (returns a promise that resolves on Twilio callback)
    const resultPromise = createPendingTransfer(requestId, destination, conversationSummary, () => removeBridge(requestId))

    // 2. Initiate the Twilio call
    const callResult = await initiateTransferCall({ requestId, destination, conversationSummary })

    if (!callResult.success) {
      resolveTransfer(requestId, { accepted: false, reason: callResult.error || 'Failed to initiate call.' })
      return reply.send({
        accepted: false,
        reason: callResult.error || 'Failed to initiate call.',
      })
    }

    if (callResult.callSid) {
      setCallSid(requestId, callResult.callSid)
    }

    request.log.info({ callSid: callResult.callSid }, 'Twilio call initiated')

    // 3. Wait for the Twilio status callback to resolve the transfer
    const result = await resultPromise

    request.log.info({ requestId, result }, 'Transfer resolved')

    // 4. Return result to frontend
    return reply.send(result)
  })
}
