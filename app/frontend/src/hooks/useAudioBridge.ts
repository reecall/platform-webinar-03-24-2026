import { useEffect, useRef, useState, useCallback } from 'react'
import { getAudioBridgeWsUrl } from '@/api/reecall'

export type AudioBridgeStatus = 'connecting' | 'connected' | 'ended' | 'error'

interface UseAudioBridgeOptions {
  requestId: string | null
  micStream: MediaStream | null
}

export function useAudioBridge({ requestId, micStream }: UseAudioBridgeOptions) {
  const [status, setStatus] = useState<AudioBridgeStatus>('connecting')
  const wsRef = useRef<WebSocket | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const playbackNodeRef = useRef<AudioWorkletNode | null>(null)
  const captureNodeRef = useRef<AudioWorkletNode | null>(null)
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null)

  const cleanup = useCallback(() => {
    captureNodeRef.current?.disconnect()
    captureNodeRef.current = null
    sourceNodeRef.current?.disconnect()
    sourceNodeRef.current = null
    playbackNodeRef.current?.disconnect()
    playbackNodeRef.current = null
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close()
    }
    audioContextRef.current = null
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
  }, [])

  const hangup = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ event: 'hangup' }))
    }
    cleanup()
    setStatus('ended')
  }, [cleanup])

  useEffect(() => {
    if (!requestId) return
    const activeRequestId = requestId

    let cancelled = false

    async function connect() {
      try {
        const audioCtx = new AudioContext({ sampleRate: 48000 })
        audioContextRef.current = audioCtx

        await audioCtx.audioWorklet.addModule('/mulaw-processor.js')

        const playbackNode = new AudioWorkletNode(audioCtx, 'mulaw-playback-processor')
        playbackNode.connect(audioCtx.destination)
        playbackNodeRef.current = playbackNode

        const captureNode = new AudioWorkletNode(audioCtx, 'mulaw-capture-processor')
        captureNodeRef.current = captureNode

        if (micStream) {
          const source = audioCtx.createMediaStreamSource(micStream)
          source.connect(captureNode)
          sourceNodeRef.current = source
        }

        const wsUrl = getAudioBridgeWsUrl(activeRequestId)
        const ws = new WebSocket(wsUrl)
        wsRef.current = ws

        ws.onmessage = (event) => {
          if (cancelled) return
          try {
            const msg = JSON.parse(event.data)

            if (msg.event === 'bridge-ready') {
              setStatus('connected')
              audioCtx.resume()
            }

            if (msg.event === 'audio') {
              playbackNode.port.postMessage({
                type: 'audio',
                payload: msg.payload,
              })
            }

            if (msg.event === 'call-ended') {
              setStatus('ended')
              cleanup()
            }
          } catch (err) {
            console.error('Error processing audio bridge message:', err)
          }
        }

        captureNode.port.onmessage = (event) => {
          if (event.data.type === 'audio' && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              event: 'audio',
              payload: event.data.payload,
            }))
          }
        }

        ws.onerror = (err) => {
          console.error('Audio bridge WebSocket error:', err)
          if (!cancelled) setStatus('error')
        }

        ws.onclose = () => {
          if (!cancelled) {
            setStatus(prev => prev !== 'ended' ? 'ended' : prev)
          }
        }
      } catch (err) {
        console.error('Failed to set up audio bridge:', err)
        if (!cancelled) setStatus('error')
      }
    }

    connect()

    return () => {
      cancelled = true
      cleanup()
    }
  }, [requestId, micStream, cleanup])

  return { status, hangup }
}
