export interface AssistantSummary {
  id: string
  name: string
  description: string | null
  language: string
  timezone: string
  temperature: number
  firstMessage: string | null
  projectId: string
  createdAt: string
  updatedAt: string
}

export interface Assistant extends AssistantSummary {
  voice: Voice | null
  sts: STS | null
  tts: TTS | null
  stt: STT | null
  tools: Tool[]
  mcps: MCP[]
  knowledgeBases: KnowledgeBase[]
  dataExtractionSchema: object | null
}

export interface Voice {
  id: string
  name: string
  voiceId: string
  language: string
  gender: string
  description: string | null
  multilingual: boolean
}

export interface STS {
  id: string
  name: string
  description: string | null
  modelName: string
  provider: string
}

export interface TTS {
  id: string
  name: string
  description: string | null
  modelName: string
  provider: string
}

export interface STT {
  id: string
  name: string
  description: string | null
  modelName: string
  provider: string
}

export interface Tool {
  id: string
  assistantId: string
  definitionId: string
  descriptionOverride: string | null
  configuration: Record<string, unknown>
  disableInterruptions: boolean
  definition: ToolDefinition
}

export interface ToolDefinition {
  id: string
  name: string
  description: string
}

export interface MCP {
  id: string
  name: string
  description: string | null
  url: string
  projectId: string
}

export interface KnowledgeBase {
  id: string
  name: string
  description: string | null
  knowledges: Knowledge[]
}

export interface Knowledge {
  id: string
  title: string
  content: string
  available: boolean
  knowledgeBaseId: string
}

export interface Channel {
  id: string
  name: string
  type: 'SIP' | 'WEBRTC'
  description: string | null
  assistantId: string
  projectId: string
  createdAt: string
  updatedAt: string
}

export interface CallToken {
  wsUrl: string
  token: string
}

export interface HealthResponse {
  status: string
}

export interface TransferRequest {
  requestId: string
  destination: string
  reason?: string
  conversationSummary?: string
  messages?: Array<{ role: string; content: string; timestamp?: string }>
}

export interface TransferResult {
  accepted: boolean
  reason?: string
}
