import { FastifyInstance } from 'fastify'
import { config } from '../config.js'

interface EvaluationData {
  quality: unknown
  resolution: unknown
  summary: unknown
  receivedAt: number
}

const sseClients: Set<(data: EvaluationData) => void> = new Set()

export function registerEvaluation(app: FastifyInstance) {
  // Webhook endpoint — called by Reecall after conversation evaluation
  app.post('/api/webhook/evaluation', async (request, reply) => {
    const { quality, resolution, summary } = request.body as Record<string, unknown>

    if (!quality && !resolution && !summary) {
      return reply.status(400).send({ error: 'At least one evaluation field required' })
    }

    const evaluation: EvaluationData = {
      quality: quality ?? null,
      resolution: resolution ?? null,
      summary: summary ?? null,
      receivedAt: Date.now(),
    }

    request.log.info('Received evaluation webhook')

    // Push to all SSE clients
    for (const notify of sseClients) {
      notify(evaluation)
    }

    return { received: true }
  })

  // SSE endpoint — frontend subscribes to receive evaluation data in real-time
  app.get('/api/evaluation/stream', async (request, reply) => {
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': config.frontendOrigin,
    })

    const notify = (data: EvaluationData) => {
      reply.raw.write(`data: ${JSON.stringify(data)}\n\n`)
    }

    sseClients.add(notify)

    request.raw.on('close', () => {
      sseClients.delete(notify)
    })
  })
}
