import {
  FileText,
  ShieldCheck,
  MessageSquareText,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Tag,
  Wrench,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type {
  EvaluationData,
  EvaluationSummary,
  EvaluationQuality,
  EvaluationResolution,
} from '@/hooks/useEvaluation'

interface EvaluationViewProps {
  evaluation: EvaluationData | null
  onBack: () => void
}

export function EvaluationView({ evaluation, onBack }: EvaluationViewProps) {
  return (
    <div className="flex flex-col items-center min-h-[calc(100vh-3.5rem)] bg-grid relative">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="h-64 w-64 rounded-full blur-3xl bg-primary/5" />
      </div>

      <div className="w-full max-w-2xl mx-auto px-4 py-10 relative z-10">
        <div className="flex items-center gap-3 mb-8">
          <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Post-call evaluation</h1>
            <p className="text-sm text-muted-foreground">
              AI-generated analysis of the conversation
            </p>
          </div>
        </div>

        {!evaluation ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Waiting for evaluation...</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <SummaryCard data={evaluation.summary} />
            <QualityCard data={evaluation.quality} />
            <ResolutionCard data={evaluation.resolution} />
          </div>
        )}
      </div>
    </div>
  )
}

function ScoreBadge({ score, label }: { score: number; label: string }) {
  const color =
    score >= 8
      ? 'bg-emerald-500/10 text-emerald-500'
      : score >= 5
        ? 'bg-amber-500/10 text-amber-500'
        : 'bg-destructive/10 text-destructive'

  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`text-lg font-bold rounded-lg px-2.5 py-0.5 ${color}`}>
        {score}/10
      </div>
      <span className="text-[11px] text-muted-foreground">{label}</span>
    </div>
  )
}

function SummaryCard({ data }: { data: EvaluationSummary }) {
  if (!data) return null

  return (
    <Card className="p-5 bg-card/50 backdrop-blur-sm border-border/50">
      <div className="flex items-center gap-2 mb-3">
        <div className="text-primary"><FileText className="h-4 w-4" /></div>
        <h3 className="text-sm font-semibold">Summary</h3>
      </div>

      {data.title && (
        <h4 className="font-medium mb-2">{data.title}</h4>
      )}
      {data.summary && (
        <p className="text-sm text-muted-foreground leading-relaxed mb-3">
          {data.summary}
        </p>
      )}

      {data.action_items?.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Action items</p>
          <ul className="space-y-1">
            {data.action_items.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.tags?.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <Tag className="h-3 w-3 text-muted-foreground" />
          {data.tags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-[10px]">
              {tag}
            </Badge>
          ))}
        </div>
      )}
    </Card>
  )
}

function QualityCard({ data }: { data: EvaluationQuality }) {
  if (!data) return null

  return (
    <Card className="p-5 bg-card/50 backdrop-blur-sm border-border/50">
      <div className="flex items-center gap-2 mb-4">
        <div className="text-primary"><ShieldCheck className="h-4 w-4" /></div>
        <h3 className="text-sm font-semibold">Quality analysis</h3>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-4">
        <ScoreBadge score={data.overall_score} label="Overall" />
        <ScoreBadge score={data.tone_score} label="Tone" />
        <ScoreBadge score={data.clarity_score} label="Clarity" />
        <ScoreBadge score={data.fluidity_score} label="Fluidity" />
      </div>

      {data.strengths?.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Strengths</p>
          <ul className="space-y-1">
            {data.strengths.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.improvements?.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Improvements</p>
          <ul className="space-y-1">
            {data.improvements.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <AlertCircle className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  )
}

function ResolutionCard({ data }: { data: EvaluationResolution }) {
  if (!data) return null

  return (
    <Card className="p-5 bg-card/50 backdrop-blur-sm border-border/50">
      <div className="flex items-center gap-2 mb-3">
        <div className="text-primary"><MessageSquareText className="h-4 w-4" /></div>
        <h3 className="text-sm font-semibold">Resolution analysis</h3>
      </div>

      {data.caller_intent && (
        <div className="mb-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Caller intent</p>
          <p className="text-sm text-muted-foreground">{data.caller_intent}</p>
        </div>
      )}

      {data.resolution_status && (
        <div className="mb-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Status</p>
          <Badge
            variant="outline"
            className={
              data.resolution_status.toLowerCase().includes('resolved')
                ? 'border-emerald-500/50 text-emerald-500'
                : 'border-amber-500/50 text-amber-500'
            }
          >
            {data.resolution_status}
          </Badge>
        </div>
      )}

      {data.resolution_details && (
        <div className="mb-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Details</p>
          <p className="text-sm text-muted-foreground leading-relaxed">{data.resolution_details}</p>
        </div>
      )}

      {data.tools_used?.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Tools used</p>
          <div className="flex items-center gap-1.5 flex-wrap">
            <Wrench className="h-3 w-3 text-muted-foreground" />
            {data.tools_used.map((tool) => (
              <Badge key={tool} variant="outline" className="text-[10px]">
                {tool}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}
