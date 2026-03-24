import { useState, useMemo } from 'react'
import { Toaster } from '@/components/ui/sonner'
import { useConfig } from '@/hooks/useConfig'
import { useEvaluation } from '@/hooks/useEvaluation'
import { SetupScreen } from '@/components/SetupScreen'
import { Header } from '@/components/Header'
import { AssistantList } from '@/components/AssistantList'
import { CallView } from '@/components/CallView'
import { EvaluationView } from '@/components/EvaluationView'
import type { CallToken } from '@/types/reecall'

type AppState = 'connecting' | 'error' | 'browsing' | 'in_call' | 'post_call'

interface CallInfo extends CallToken {
  assistantName: string
  assistantId: string
  hasHooks: boolean
}

export default function App() {
  const { isConnected, isLoading, error, retry } = useConfig()
  const [callInfo, setCallInfo] = useState<CallInfo | null>(null)
  const [showEvaluation, setShowEvaluation] = useState(false)
  const [selectedAssistantId, setSelectedAssistantId] = useState<string | null>(null)
  const [hasHooks, setHasHooks] = useState(false)

  const { evaluation, clear: clearEvaluation } = useEvaluation(hasHooks && (!!callInfo || showEvaluation))

  const appState = useMemo((): AppState => {
    if (isLoading) return 'connecting'
    if (!isConnected) return 'error'
    if (showEvaluation) return 'post_call'
    if (callInfo) return 'in_call'
    return 'browsing'
  }, [isLoading, isConnected, showEvaluation, callInfo])

  const handleCallStart = (info: CallInfo) => {
    clearEvaluation()
    setSelectedAssistantId(info.assistantId)
    setHasHooks(info.hasHooks)
    setCallInfo(info)
  }

  const handleCallEnd = () => {
    setCallInfo(null)
    if (hasHooks) {
      setShowEvaluation(true)
    }
  }

  const handleBackToBrowsing = () => {
    setShowEvaluation(false)
    clearEvaluation()
  }

  return (
    <div className="min-h-screen bg-background">
      <Toaster
        toastOptions={{
          style: {
            background: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            color: 'hsl(var(--foreground))',
          },
        }}
      />
      {appState === 'connecting' && (
        <div className="flex items-center justify-center min-h-screen bg-grid">
          <div className="flex flex-col items-center gap-4">
            <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <p className="text-sm text-muted-foreground font-medium">Connecting to backend...</p>
          </div>
        </div>
      )}
      {appState === 'error' && (
        <SetupScreen error={error || 'Unknown error'} onRetry={retry} />
      )}
      {appState === 'browsing' && (
        <>
          <Header />
          <AssistantList onCallStart={handleCallStart} initialSelectedId={selectedAssistantId} />
        </>
      )}
      {appState === 'in_call' && callInfo && (
        <>
          <Header />
          <CallView
            wsUrl={callInfo.wsUrl}
            token={callInfo.token}
            assistantName={callInfo.assistantName}
            onDisconnect={handleCallEnd}
          />
        </>
      )}
      {appState === 'post_call' && (
        <>
          <Header />
          <EvaluationView evaluation={evaluation} onBack={handleBackToBrowsing} />
        </>
      )}
    </div>
  )
}
