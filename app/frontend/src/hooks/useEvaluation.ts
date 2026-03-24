import { useEffect, useState } from 'react'
import { API_URL } from '@/api/reecall'

export interface EvaluationSummary {
  title: string
  summary: string
  action_items: string[]
  tags: string[]
}

export interface EvaluationQuality {
  tone_score: number
  clarity_score: number
  fluidity_score: number
  overall_score: number
  strengths: string[]
  improvements: string[]
}

export interface EvaluationResolution {
  caller_intent: string
  resolution_status: string
  tools_used: string[]
  resolution_details: string
}

export interface EvaluationData {
  quality: EvaluationQuality
  resolution: EvaluationResolution
  summary: EvaluationSummary
  receivedAt: number
}

export function useEvaluation(enabled: boolean) {
  const [evaluation, setEvaluation] = useState<EvaluationData | null>(null)

  useEffect(() => {
    if (!enabled) return

    const eventSource = new EventSource(`${API_URL}/api/evaluation/stream`)

    eventSource.onmessage = (event) => {
      try {
        const data: EvaluationData = JSON.parse(event.data)
        setEvaluation(data)
      } catch {
        // ignore parse errors
      }
    }

    return () => {
      eventSource.close()
    }
  }, [enabled])

  const clear = () => setEvaluation(null)

  return { evaluation, clear }
}
