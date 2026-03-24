import Fastify from 'fastify'
import cors from '@fastify/cors'
import formbody from '@fastify/formbody'
import websocket from '@fastify/websocket'
import { config } from './config.js'
import { registerReecallProxy } from './routes/reecall-proxy.js'
import { registerCallsProxy } from './routes/calls-proxy.js'
import { registerTransfers } from './routes/transfers.js'
import { registerTwilioWebhooks } from './routes/twilio-webhooks.js'
import { registerEvaluation } from './routes/evaluation.js'

const app = Fastify({ logger: true })

await app.register(cors, { origin: config.frontendOrigin })
await app.register(formbody)
await app.register(websocket)

app.get('/health', async () => {
  return { status: 'ok' }
})

registerReecallProxy(app)
registerCallsProxy(app)
registerTransfers(app)
registerTwilioWebhooks(app)
registerEvaluation(app)

try {
  await app.listen({ port: config.port, host: '0.0.0.0' })
  app.log.info(`Backend listening on port ${config.port}`)
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
