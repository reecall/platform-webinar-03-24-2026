import { useState, useEffect, useCallback } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { RefreshCw, Bot } from 'lucide-react'
import { getAssistants, getChannels } from '@/api/reecall'
import { AssistantCard } from '@/components/AssistantCard'
import { AssistantDetail } from '@/components/AssistantDetail'
import type { AssistantSummary, Channel, CallToken } from '@/types/reecall'

interface AssistantListProps {
  onCallStart: (info: CallToken & { assistantName: string; assistantId: string; hasHooks: boolean }) => void
  initialSelectedId?: string | null
}

export function AssistantList({ onCallStart, initialSelectedId = null }: AssistantListProps) {
  const [assistants, setAssistants] = useState<AssistantSummary[]>([])
  const [channels, setChannels] = useState<Channel[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [fetchedAssistants, fetchedChannels] = await Promise.all([
        getAssistants(),
        getChannels(),
      ])
      setAssistants(fetchedAssistants)
      setChannels(fetchedChannels)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const webrtcChannels = channels.filter(c => c.type === 'WEBRTC')
  const webrtcAssistantIds = new Set(webrtcChannels.map(c => c.assistantId))
  const filteredAssistants = assistants.filter(a => webrtcAssistantIds.has(a.id))

  const selectedChannels = selectedId
    ? channels.filter(c => c.assistantId === selectedId)
    : []

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      <div className="w-80 border-r border-border/50 bg-sidebar overflow-y-auto">
        <div className="p-4 border-b border-white/5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50">
            Assistants
          </h2>
        </div>
        <div className="p-3 space-y-2">
          {isLoading && (
            <>
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="rounded-xl bg-sidebar-muted p-4 space-y-3">
                  <Skeleton className="h-4 w-3/4 bg-white/5" />
                  <Skeleton className="h-3 w-full bg-white/5" />
                  <Skeleton className="h-3 w-1/2 bg-white/5" />
                </div>
              ))}
            </>
          )}
          {error && (
            <div className="text-center space-y-3 py-8">
              <p className="text-sm text-red-400">{error}</p>
              <Button variant="outline" size="sm" onClick={load} className="border-white/10 text-sidebar-foreground hover:bg-sidebar-muted">
                <RefreshCw className="mr-2 h-3 w-3" />
                Retry
              </Button>
            </div>
          )}
          {!isLoading && !error && filteredAssistants.length === 0 && (
            <div className="text-center py-12 space-y-3">
              <Bot className="h-8 w-8 text-sidebar-foreground/30 mx-auto" />
              <p className="text-sm text-sidebar-foreground/50">
                No assistants with WebRTC channels found.
              </p>
            </div>
          )}
          {!isLoading && !error && filteredAssistants.map(assistant => (
            <AssistantCard
              key={assistant.id}
              assistant={assistant}
              isSelected={selectedId === assistant.id}
              onClick={() => setSelectedId(assistant.id)}
            />
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-grid">
        {selectedId ? (
          <AssistantDetail
            assistantId={selectedId}
            channels={selectedChannels}
            onCallStart={onCallStart}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <div className="h-16 w-16 rounded-2xl bg-primary/5 flex items-center justify-center">
              <Bot className="h-8 w-8 text-primary/30" />
            </div>
            <p className="text-sm text-muted-foreground">Select an assistant to view details</p>
          </div>
        )}
      </div>
    </div>
  )
}
