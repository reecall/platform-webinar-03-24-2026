import { useState, useEffect, useCallback } from 'react'
import { Phone, Loader2, ExternalLink, ChevronDown, RefreshCw, Cpu, Wrench, BookOpen, Code2, MessageSquareQuote, Globe, Clock, Thermometer, Mic } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { getAssistant, getHooks, initiateCall } from '@/api/reecall'
import type { Assistant, Channel, CallToken } from '@/types/reecall'

interface AssistantDetailProps {
  assistantId: string
  channels: Channel[]
  onCallStart: (info: CallToken & { assistantName: string; assistantId: string; hasHooks: boolean }) => void
}

export function AssistantDetail({ assistantId, channels, onCallStart }: AssistantDetailProps) {
  const [assistant, setAssistant] = useState<Assistant | null>(null)
  const [hasHooks, setHasHooks] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [callingChannelId, setCallingChannelId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    setAssistant(null)
    try {
      const [data, hooks] = await Promise.all([getAssistant(assistantId), getHooks()])
      setAssistant(data)
      setHasHooks(hooks.length > 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setIsLoading(false)
    }
  }, [assistantId])

  useEffect(() => {
    load()
  }, [load])

  const handleCall = async (channelId: string) => {
    setCallingChannelId(channelId)
    try {
      const token = await initiateCall(channelId)
      onCallStart({ ...token, assistantName: assistant?.name || 'Assistant', assistantId, hasHooks })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to start call')
    } finally {
      setCallingChannelId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="p-8 space-y-6 max-w-4xl">
        <div className="rounded-2xl bg-gradient-to-br from-primary/5 via-primary/[0.02] to-transparent border border-border/50 p-8">
          <div className="flex items-start gap-5">
            <Skeleton className="h-16 w-16 rounded-2xl" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-4 w-full max-w-md" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-14 rounded-full" />
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
        <Skeleton className="h-40 rounded-xl" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <p className="text-sm text-destructive">{error}</p>
        <Button variant="outline" size="sm" onClick={load}>
          <RefreshCw className="mr-2 h-3 w-3" />
          Retry
        </Button>
      </div>
    )
  }

  if (!assistant) return null

  const totalKnowledges = assistant.knowledgeBases.reduce(
    (sum, kb) => sum + kb.knowledges.length, 0
  )

  return (
    <div className="p-8 max-w-4xl space-y-6">

      <div className="relative rounded-2xl bg-card border border-border shadow-sm p-8 overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <div className="relative flex items-start gap-5">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 glow-purple">
            <span className="text-2xl font-bold text-primary">{assistant.name.charAt(0).toUpperCase()}</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold tracking-tight">{assistant.name}</h1>
              <Button variant="ghost" size="icon" onClick={load} className="h-8 w-8 text-muted-foreground hover:text-foreground">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            {assistant.description && (
              <p className="text-muted-foreground mt-1.5 leading-relaxed max-w-xl">{assistant.description}</p>
            )}
            <div className="flex gap-3 mt-4 flex-wrap">
              <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <Globe className="h-3 w-3" />
                {assistant.language}
              </div>
              <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {assistant.timezone}
              </div>
              <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <Thermometer className="h-3 w-3" />
                {assistant.temperature}
              </div>
            </div>
          </div>
        </div>
        {assistant.firstMessage && (
          <div className="relative flex gap-3 items-start mt-6 pt-6 border-t border-border/50">
            <div className="shrink-0 mt-0.5">
              <MessageSquareQuote className="h-4 w-4 text-primary/50" />
            </div>
            <div className="border-l-2 border-primary/20 pl-4">
              <p className="text-sm text-muted-foreground italic leading-relaxed">
                "{assistant.firstMessage}"
              </p>
              <p className="text-[10px] text-muted-foreground/60 mt-1 uppercase tracking-wider font-medium">First message</p>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-primary/20 bg-card p-5 shadow-sm space-y-2">
        {channels.map(channel => (
          <div key={channel.id} className="flex items-center justify-between rounded-xl bg-muted/30 border border-border/50 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className={`h-2 w-2 rounded-full ${channel.type === 'WEBRTC' ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
              <span className="text-sm font-medium">{channel.name}</span>
              <Badge variant="outline" className="text-[10px]">{channel.type}</Badge>
            </div>
            {channel.type === 'WEBRTC' && (
              <Button
                size="sm"
                onClick={() => handleCall(channel.id)}
                disabled={callingChannelId !== null}
                className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 transition-shadow hover:shadow-primary/35"
              >
                {callingChannelId === channel.id ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Phone className="mr-1.5 h-3.5 w-3.5" />
                )}
                Call
              </Button>
            )}
          </div>
        ))}
      </div>

      <SectionCard title="Model" icon={<Cpu className="h-4 w-4" />} defaultOpen>
        {(assistant.sts || assistant.tts || assistant.voice) ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {assistant.sts && (
              <ModelCard label="STS" name={assistant.sts.name} provider={assistant.sts.provider} model={assistant.sts.modelName} />
            )}
            {assistant.tts && (
              <ModelCard label="TTS" name={assistant.tts.name} provider={assistant.tts.provider} model={assistant.tts.modelName} />
            )}
            {assistant.voice && (
              <VoiceCard name={assistant.voice.name} language={assistant.voice.language} gender={assistant.voice.gender} />
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No model configured</p>
        )}
      </SectionCard>

      <SectionCard title="Knowledge Bases" icon={<BookOpen className="h-4 w-4" />} defaultOpen>
        {assistant.knowledgeBases.length > 0 ? (
          <div className="space-y-3">
            <div className="flex gap-3">
              <StatPill value={assistant.knowledgeBases.length} label={assistant.knowledgeBases.length === 1 ? 'base' : 'bases'} />
              <StatPill value={totalKnowledges} label={totalKnowledges === 1 ? 'knowledge' : 'knowledges'} />
            </div>
            <div className="space-y-2">
              {assistant.knowledgeBases.map(kb => (
                <Collapsible key={kb.id}>
                  <CollapsibleTrigger className="flex items-center gap-2 w-full rounded-xl bg-muted/30 border border-border/50 px-4 py-3 transition-colors hover:bg-muted/50 group">
                    <BookOpen className="h-3.5 w-3.5 text-primary/60 shrink-0" />
                    <span className="text-sm font-medium flex-1 text-left">{kb.name}</span>
                    <Badge variant="outline" className="text-[10px] mr-1">{kb.knowledges.length}</Badge>
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="ml-4 mt-1 border-l-2 border-border/50 pl-4 py-2 space-y-1.5">
                      {kb.description && (
                        <p className="text-xs text-muted-foreground mb-2">{kb.description}</p>
                      )}
                      {kb.knowledges.map(k => (
                        <div key={k.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary/30 shrink-0" />
                          {k.title}
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No knowledge bases</p>
        )}
      </SectionCard>

      <SectionCard title="Tools & MCP" icon={<Wrench className="h-4 w-4" />} defaultOpen>
        <div className="space-y-4">
          {assistant.tools.length > 0 && (
            <div>
              <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider mb-2">Tools</p>
              <div className="flex gap-2 flex-wrap">
                {assistant.tools.map(tool => (
                  <span
                    key={tool.id}
                    className="inline-flex items-center rounded-lg bg-primary/5 border border-primary/10 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-primary/10"
                  >
                    {tool.definition.name}
                  </span>
                ))}
              </div>
            </div>
          )}
          {assistant.mcps.length > 0 && (
            <div>
              <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider mb-2">MCP Servers</p>
              <div className="space-y-2">
                {assistant.mcps.map(mcp => (
                  <div key={mcp.id} className="group flex items-center justify-between rounded-xl bg-muted/30 border border-border/50 px-4 py-3 transition-colors hover:bg-muted/50">
                    <div className="min-w-0">
                      <span className="text-sm font-medium">{mcp.name}</span>
                      {mcp.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{mcp.description}</p>
                      )}
                    </div>
                    <a
                      href={mcp.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-primary opacity-60 group-hover:opacity-100 transition-opacity hover:underline shrink-0 ml-3"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Open
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
          {assistant.tools.length === 0 && assistant.mcps.length === 0 && (
            <p className="text-sm text-muted-foreground">No tools or MCP servers</p>
          )}
        </div>
      </SectionCard>

      {assistant.dataExtractionSchema && (
        <SectionCard title="Data Extraction Schema" icon={<Code2 className="h-4 w-4" />} defaultOpen={false}>
          <div className="relative rounded-xl bg-sidebar text-sidebar-foreground border border-white/5 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/5">
              <div className="h-2.5 w-2.5 rounded-full bg-white/10" />
              <div className="h-2.5 w-2.5 rounded-full bg-white/10" />
              <div className="h-2.5 w-2.5 rounded-full bg-white/10" />
              <span className="text-[10px] text-white/30 ml-2 font-mono">schema.json</span>
            </div>
            <pre className="p-4 text-sm overflow-auto font-mono leading-relaxed text-white/70">
              {JSON.stringify(assistant.dataExtractionSchema, null, 2)}
            </pre>
          </div>
        </SectionCard>
      )}
    </div>
  )
}

function ModelCard({ label, name, provider, model }: { label: string; name: string; provider: string; model: string }) {
  return (
    <div className="rounded-xl border border-border/50 bg-muted/20 p-4 space-y-3 transition-colors hover:bg-muted/40">
      <div className="flex items-center justify-between">
        <Badge variant="outline" className="text-[10px] font-semibold uppercase tracking-wider">{label}</Badge>
      </div>
      <p className="text-sm font-semibold truncate">{name}</p>
      <div className="flex gap-1.5 flex-wrap">
        <span className="text-[10px] px-2 py-0.5 rounded-md bg-primary/5 border border-primary/10 text-muted-foreground">{provider}</span>
        <span className="text-[10px] px-2 py-0.5 rounded-md bg-muted/50 border border-border/50 text-muted-foreground font-mono">{model}</span>
      </div>
    </div>
  )
}

function VoiceCard({ name, language, gender }: { name: string; language: string; gender: string }) {
  return (
    <div className="rounded-xl border border-border/50 bg-muted/20 p-4 space-y-3 transition-colors hover:bg-muted/40">
      <div className="flex items-center justify-between">
        <Badge variant="outline" className="text-[10px] font-semibold uppercase tracking-wider">Voice</Badge>
        <Mic className="h-3.5 w-3.5 text-primary/40" />
      </div>
      <p className="text-sm font-semibold truncate">{name}</p>
      <div className="flex gap-1.5 flex-wrap">
        <span className="text-[10px] px-2 py-0.5 rounded-md bg-primary/5 border border-primary/10 text-muted-foreground">{language}</span>
        <span className="text-[10px] px-2 py-0.5 rounded-md bg-muted/50 border border-border/50 text-muted-foreground capitalize">{gender}</span>
      </div>
    </div>
  )
}

function StatPill({ value, label }: { value: number; label: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-lg bg-muted/30 border border-border/50 px-3 py-1.5">
      <span className="text-sm font-bold text-primary">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  )
}

function SectionCard({
  title,
  icon,
  defaultOpen = true,
  children,
}: {
  title: string
  icon: React.ReactNode
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger className="flex items-center gap-3 w-full px-6 py-4 hover:bg-muted/50 transition-colors group">
          <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/15 flex items-center justify-center shrink-0">
            <span className="text-primary">{icon}</span>
          </div>
          <h3 className="text-sm font-semibold flex-1 text-left">{title}</h3>
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${open ? '' : '-rotate-90'}`} />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-6 pb-5 pt-1">
            {children}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}
