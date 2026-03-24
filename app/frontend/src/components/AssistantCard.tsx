import { Badge } from '@/components/ui/badge'
import type { AssistantSummary } from '@/types/reecall'

interface AssistantCardProps {
  assistant: AssistantSummary
  onClick: () => void
  isSelected: boolean
}

export function AssistantCard({ assistant, onClick, isSelected }: AssistantCardProps) {
  return (
    <button
      className={`w-full text-left rounded-xl p-4 transition-all duration-200 ${
        isSelected
          ? 'bg-sidebar-accent/15 border border-sidebar-accent/30 glow-purple'
          : 'bg-transparent hover:bg-sidebar-muted border border-transparent'
      }`}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
          isSelected
            ? 'bg-sidebar-accent text-white'
            : 'bg-sidebar-muted text-sidebar-foreground/60'
        }`}>
          {assistant.name.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className={`text-sm font-semibold truncate ${
            isSelected ? 'text-white' : 'text-sidebar-foreground'
          }`}>
            {assistant.name}
          </h3>
          {assistant.description && (
            <p className="text-xs text-sidebar-foreground/50 line-clamp-2 mt-1 leading-relaxed">
              {assistant.description}
            </p>
          )}
          <div className="flex gap-1.5 mt-2.5 flex-wrap">
            <Badge variant="secondary" className="text-[10px] px-2 py-0 bg-white/5 text-sidebar-foreground/60 border-0 hover:bg-white/5">
              {assistant.language}
            </Badge>
            <Badge variant="outline" className="text-[10px] px-2 py-0 border-white/10 text-sidebar-foreground/50 hover:bg-transparent">
              {assistant.temperature}
            </Badge>
          </div>
        </div>
      </div>
    </button>
  )
}
