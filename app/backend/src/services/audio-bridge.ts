import { WebSocket } from 'ws'

/**
 * AudioBridge connects a Twilio media stream WebSocket to a frontend browser WebSocket.
 *
 * Twilio sends/receives mulaw 8kHz audio as base64-encoded payloads.
 * The frontend sends/receives the same format — the browser handles encoding/decoding
 * via AudioWorklet with mulaw codec.
 *
 * Flow:
 *   Twilio WS → (mulaw base64) → AudioBridge → (mulaw base64) → Frontend WS
 *   Frontend WS → (mulaw base64) → AudioBridge → (mulaw base64) → Twilio WS
 */

interface BridgeEntry {
  twilioWs: WebSocket | null
  frontendWs: WebSocket | null
  twilioStreamSid: string | null
}

const bridges = new Map<string, BridgeEntry>()

function isOpen(ws: WebSocket | null): ws is WebSocket {
  return ws !== null && ws.readyState === WebSocket.OPEN
}

function sendTwilioStop(bridge: BridgeEntry): void {
  if (isOpen(bridge.twilioWs) && bridge.twilioStreamSid) {
    bridge.twilioWs.send(JSON.stringify({
      event: 'stop',
      streamSid: bridge.twilioStreamSid,
    }))
  }
}

export function createBridge(requestId: string): BridgeEntry {
  const entry: BridgeEntry = {
    twilioWs: null,
    frontendWs: null,
    twilioStreamSid: null,
  }
  bridges.set(requestId, entry)
  return entry
}

export function getBridge(requestId: string): BridgeEntry | undefined {
  return bridges.get(requestId)
}

export function removeBridge(requestId: string): void {
  const bridge = bridges.get(requestId)
  if (bridge) {
    if (isOpen(bridge.twilioWs)) bridge.twilioWs.close()
    if (isOpen(bridge.frontendWs)) bridge.frontendWs.close()
    bridges.delete(requestId)
  }
}

export function attachTwilioWs(requestId: string, ws: WebSocket): void {
  const bridge = getBridge(requestId)
  if (!bridge) {
    ws.close()
    return
  }

  bridge.twilioWs = ws

  ws.on('message', (data: Buffer) => {
    try {
      const msg = JSON.parse(data.toString())

      switch (msg.event) {
        case 'connected':
          break

        case 'start':
          bridge.twilioStreamSid = msg.start.streamSid
          if (isOpen(bridge.frontendWs)) {
            bridge.frontendWs.send(JSON.stringify({ event: 'bridge-ready' }))
          }
          break

        case 'media':
          if (isOpen(bridge.frontendWs)) {
            bridge.frontendWs.send(JSON.stringify({
              event: 'audio',
              payload: msg.media.payload,
            }))
          }
          break

        case 'stop':
          if (isOpen(bridge.frontendWs)) {
            bridge.frontendWs.send(JSON.stringify({ event: 'call-ended' }))
          }
          removeBridge(requestId)
          break
      }
    } catch {
      // Malformed Twilio message — ignore
    }
  })

  ws.on('close', () => {
    if (isOpen(bridge.frontendWs)) {
      bridge.frontendWs.send(JSON.stringify({ event: 'call-ended' }))
    }
  })
}

export function attachFrontendWs(requestId: string, ws: WebSocket): void {
  const bridge = getBridge(requestId)
  if (!bridge) {
    ws.close()
    return
  }

  bridge.frontendWs = ws

  if (bridge.twilioStreamSid) {
    ws.send(JSON.stringify({ event: 'bridge-ready' }))
  }

  ws.on('message', (data: Buffer) => {
    try {
      const msg = JSON.parse(data.toString())

      if (msg.event === 'audio' && isOpen(bridge.twilioWs) && bridge.twilioStreamSid) {
        bridge.twilioWs.send(JSON.stringify({
          event: 'media',
          streamSid: bridge.twilioStreamSid,
          media: { payload: msg.payload },
        }))
      }

      if (msg.event === 'hangup') {
        sendTwilioStop(bridge)
        removeBridge(requestId)
      }
    } catch {
      // Malformed frontend message — ignore
    }
  })

  ws.on('close', () => {
    sendTwilioStop(bridge)
  })
}
