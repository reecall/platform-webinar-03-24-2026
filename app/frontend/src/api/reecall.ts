import type { HealthResponse, AssistantSummary, Channel, Assistant, CallToken, TransferRequest, TransferResult } from '@/types/reecall'

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export async function getHealth(): Promise<HealthResponse> {
  const res = await fetch(`${API_URL}/health`)
  if (!res.ok) throw new Error(`Health check failed: ${res.status}`)
  return res.json()
}

export async function getHooks(): Promise<unknown[]> {
  const res = await fetch(`${API_URL}/api/reecall/automation/hooks`)
  if (!res.ok) return []
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

export async function getAssistants(): Promise<AssistantSummary[]> {
  const include = JSON.stringify({
    tools: false,
    mcps: false,
    voice: false,
    knowledgeBases: false,
    stt: false,
    tts: false,
    llm: false,
    sts: false,
  })
  const res = await fetch(
    `${API_URL}/api/reecall/conversational/assistants?include=${encodeURIComponent(include)}`
  )
  if (!res.ok) throw new Error(`Failed to fetch assistants: ${res.status}`)
  return res.json()
}

export async function getChannels(): Promise<Channel[]> {
  const res = await fetch(`${API_URL}/api/reecall/conversational/channels`)
  if (!res.ok) throw new Error(`Failed to fetch channels: ${res.status}`)
  return res.json()
}

export async function getAssistant(id: string): Promise<Assistant> {
  const res = await fetch(`${API_URL}/api/reecall/conversational/assistants/${id}`)
  if (!res.ok) throw new Error(`Failed to fetch assistant: ${res.status}`)
  return res.json()
}

export async function initiateCall(channelId: string): Promise<CallToken> {
  const res = await fetch(`${API_URL}/api/calls/${channelId}`, { method: 'POST' })
  if (!res.ok) throw new Error(`Failed to initiate call: ${res.status}`)
  return res.json()
}

export async function executeTransfer(request: TransferRequest): Promise<TransferResult> {
  const res = await fetch(`${API_URL}/api/transfers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })

  if (!res.ok) {
    return { accepted: false, reason: 'Backend transfer request failed.' }
  }

  return res.json()
}

/** Returns the WebSocket URL for the audio bridge for a given transfer. */
export function getAudioBridgeWsUrl(requestId: string): string {
  const wsBase = API_URL.replace(/^http/, 'ws')
  return `${wsBase}/api/audio-bridge/${requestId}`
}
