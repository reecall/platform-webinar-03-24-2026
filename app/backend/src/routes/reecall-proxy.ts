import { FastifyInstance } from 'fastify'
import { config } from '../config.js'

export function registerReecallProxy(app: FastifyInstance) {
  app.all('/api/reecall/*', async (request, reply) => {
    const path = (request.params as { '*': string })['*']
    const base = config.baseUrl.endsWith('/') ? config.baseUrl : config.baseUrl + '/'
    const url = new URL(path, base)

    const originalUrl = new URL(request.url, `http://${request.hostname}`)
    originalUrl.searchParams.forEach((value, key) => {
      url.searchParams.set(key, value)
    })

    const contentType = request.headers['content-type'] || 'application/json'

    const fetchOptions: RequestInit = {
      method: request.method,
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': contentType,
      },
    }

    if (request.body && request.method !== 'GET' && request.method !== 'HEAD') {
      fetchOptions.body = JSON.stringify(request.body)
    }

    try {
      const response = await fetch(url.toString(), fetchOptions)
      const body = await response.text()

      reply.status(response.status)
      reply.header('content-type', response.headers.get('content-type') || 'application/json')
      return reply.send(body)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      request.log.error({ err: message, proxyUrl: url.toString() }, 'Reecall API unreachable')
      return reply.status(502).send({ error: 'Reecall API unreachable', detail: message })
    }
  })
}
