import { XCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SetupScreenProps {
  error: string
  onRetry: () => void
}

export function SetupScreen({ error, onRetry }: SetupScreenProps) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background bg-grid">
      <div className="w-full max-w-md rounded-2xl border border-border/50 bg-card p-8 shadow-lg space-y-6">
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <XCircle className="h-6 w-6 text-destructive" />
          </div>
          <h2 className="text-lg font-semibold">Backend not reachable</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Make sure the backend is running and configured. See README for setup instructions.
          </p>
        </div>
        <div className="rounded-lg bg-muted/50 px-4 py-3">
          <p className="text-xs text-muted-foreground font-mono break-all">{error}</p>
        </div>
        <Button onClick={onRetry} className="w-full bg-primary hover:bg-primary/90 shadow-md shadow-primary/20">
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry connection
        </Button>
      </div>
    </div>
  )
}
