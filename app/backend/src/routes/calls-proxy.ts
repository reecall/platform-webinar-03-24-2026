import { FastifyInstance } from 'fastify'
import { config } from '../config.js'

export function registerCallsProxy(app: FastifyInstance) {
  app.post<{ Params: { channelId: string } }>('/api/calls/:channelId', async (request, reply) => {
    const { channelId } = request.params
    const url = `${config.callsUrl}/${channelId}`

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
        },
      })

      const body = await response.text()
      reply.status(response.status)
      reply.header('content-type', response.headers.get('content-type') || 'application/json')
      return reply.send(body)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      request.log.error({ err: message, url }, 'Reecall Calls API unreachable')
      return reply.status(502).send({ error: 'Reecall Calls API unreachable', detail: message })
    }
  })
}
