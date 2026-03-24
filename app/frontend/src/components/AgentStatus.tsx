import { useVoiceAssistant, BarVisualizer } from '@livekit/components-react'
import { Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface AgentStatusProps {
  assistantName: string
}

const statusConfig: Record<string, { label: string; variant: 'outline' | 'secondary' | 'default' | 'destructive'; animate: boolean }> = {
  connecting: { label: 'Connecting...', variant: 'outline', animate: true },
  'pre-connect-buffering': { label: 'Buffering...', variant: 'outline', animate: true },
  initializing: { label: 'Initializing...', variant: 'outline', animate: true },
  listening: { label: 'Listening...', variant: 'secondary', animate: false },
  thinking: { label: 'Thinking...', variant: 'outline', animate: false },
  speaking: { label: 'Speaking...', variant: 'default', animate: false },
  failed: { label: 'Failed', variant: 'destructive', animate: false },
  disconnected: { label: 'Disconnected', variant: 'destructive', animate: false },
}

const defaultConfig = statusConfig.connecting

export function AgentStatus({ assistantName }: AgentStatusProps) {
  const { state, audioTrack } = useVoiceAssistant()
  const config = statusConfig[state] ?? defaultConfig

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="flex flex-col items-center gap-4">
        <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center glow-purple">
          <span className="text-2xl font-bold text-primary">{assistantName.charAt(0).toUpperCase()}</span>
        </div>
        <h2 className="text-xl font-bold tracking-tight">{assistantName}</h2>
        <Badge
          variant={config.variant}
          className={`gap-1.5 ${state === 'thinking' ? 'animate-pulse-soft' : ''} ${
            config.variant === 'default' ? 'bg-primary hover:bg-primary shadow-sm shadow-primary/20' : ''
          }`}
        >
          {config.animate && <Loader2 className="h-3 w-3 animate-spin" />}
          {config.label}
        </Badge>
      </div>
      <BarVisualizer
        state={state}
        trackRef={audioTrack}
        barCount={7}
        style={{ width: '300px', height: '150px' }}
      />
    </div>
  )
}
