import { FastifyInstance } from 'fastify'
import { config } from '../config.js'
import { getPendingTransfer, resolveTransfer, setCallSid } from '../services/transfer-store.js'
import { attachTwilioWs, attachFrontendWs } from '../services/audio-bridge.js'

export function registerTwilioWebhooks(app: FastifyInstance) {

  /**
   * TwiML endpoint — Twilio fetches this when the callee picks up.
   * Returns TwiML with <Connect><Stream> to bridge audio via WebSocket.
   */
  app.all<{ Params: { requestId: string } }>(
    '/api/twilio/twiml/:requestId',
    async (request, reply) => {
      const { requestId } = request.params
      const transfer = getPendingTransfer(requestId)

      const summary = transfer?.conversationSummary || 'A caller is being transferred to you.'

      if (!config.publicBaseUrl) {
        return reply.status(500).send({ error: 'PUBLIC_BASE_URL is not configured' })
      }

      const wsUrl = config.publicBaseUrl.replace(/^http/, 'ws')
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">${escapeXml(summary)}</Say>
  <Connect>
    <Stream url="${wsUrl}/api/twilio/stream/${requestId}" />
  </Connect>
</Response>`

      reply.header('Content-Type', 'text/xml')
      return reply.send(twiml)
    }
  )

  /**
   * WebSocket endpoint for Twilio media streams.
   * Twilio connects here after <Connect><Stream> in the TwiML.
   */
  app.get<{ Params: { requestId: string } }>(
    '/api/twilio/stream/:requestId',
    { websocket: true },
    (socket, request) => {
      const { requestId } = request.params
      request.log.info({ requestId }, 'Twilio stream WebSocket connected')
      attachTwilioWs(requestId, socket)
    }
  )

  /**
   * WebSocket endpoint for the frontend browser.
   * The frontend connects here to send/receive audio with the SIP callee.
   */
  app.get<{ Params: { requestId: string } }>(
    '/api/audio-bridge/:requestId',
    { websocket: true },
    (socket, request) => {
      const { requestId } = request.params
      request.log.info({ requestId }, 'Frontend audio bridge WebSocket connected')
      attachFrontendWs(requestId, socket)
    }
  )

  /**
   * Status callback — Twilio POSTs call status updates here.
   */
  app.post<{ Params: { requestId: string } }>(
    '/api/twilio/status/:requestId',
    async (request, reply) => {
      const { requestId } = request.params
      const body = request.body as Record<string, string>
      const callStatus = body.CallStatus
      const callSid = body.CallSid

      request.log.info({ requestId, callStatus, callSid }, 'Twilio status callback')

      if (callSid) {
        setCallSid(requestId, callSid)
      }

      switch (callStatus) {
        case 'in-progress':
        case 'completed':
          resolveTransfer(requestId, { accepted: true })
          break

        case 'busy':
          resolveTransfer(requestId, { accepted: false, reason: 'The destination number is busy.' })
          break

        case 'no-answer':
          resolveTransfer(requestId, { accepted: false, reason: 'No one answered at the destination.' })
          break

        case 'failed':
          resolveTransfer(requestId, { accepted: false, reason: 'The call to the destination failed.' })
          break

        case 'canceled':
          resolveTransfer(requestId, { accepted: false, reason: 'The transfer call was canceled.' })
          break
      }

      return reply.status(200).send('')
    }
  )
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
