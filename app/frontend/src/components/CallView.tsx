import { useEffect, useState, useCallback } from 'react'
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useRoomContext,
} from '@livekit/components-react'
import { ParticipantKind } from 'livekit-client'
import '@livekit/components-styles'
import { toast } from 'sonner'
import { MicOff, PhoneOff, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AgentStatus } from '@/components/AgentStatus'
import { CallControls } from '@/components/CallControls'
import { UserAudioIndicator } from '@/components/UserAudioIndicator'
import { executeTransfer } from '@/api/reecall'
import { useAudioBridge } from '@/hooks/useAudioBridge'
import { Badge } from '@/components/ui/badge'

interface CallViewProps {
  wsUrl: string
  token: string
  assistantName: string
  onDisconnect: () => void
}

export function CallView({ wsUrl, token, assistantName, onDisconnect }: CallViewProps) {
  const [micError, setMicError] = useState(false)

  return (
    <LiveKitRoom
      serverUrl={wsUrl}
      token={token}
      connect={true}
      audio={true}
      video={false}
      onDisconnected={() => {
        toast.info('Call ended')
        onDisconnect()
      }}
      onMediaDeviceFailure={() => {
        setMicError(true)
      }}
      onError={(err) => {
        if (err?.message?.includes('Permission') || err?.message?.includes('NotAllowed')) {
          setMicError(true)
          return
        }
        toast.error('Connection failed. Please try calling again.')
        console.error('LiveKit error:', err)
        onDisconnect()
      }}
    >
      <RoomAudioRenderer />
      <CallViewContent
        assistantName={assistantName}
        micError={micError}
      />
    </LiveKitRoom>
  )
}

interface TransferState {
  requestId: string
  destination: string
  status: 'transferring' | 'connected' | 'ended' | 'failed'
}

function CallViewContent({
  assistantName,
  micError,
}: {
  assistantName: string
  micError: boolean
}) {
  const room = useRoomContext()
  const [transfer, setTransfer] = useState<TransferState | null>(null)
  const [micStream, setMicStream] = useState<MediaStream | null>(null)

  useEffect(() => {
    let stream: MediaStream | null = null
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(s => {
        stream = s
        setMicStream(s)
      })
      .catch(() => {})
    return () => {
      stream?.getTracks().forEach(t => t.stop())
    }
  }, [])

  const { status: bridgeStatus, hangup: bridgeHangup } = useAudioBridge({
    requestId: transfer?.status === 'connected' || transfer?.status === 'transferring' ? transfer.requestId : null,
    micStream,
  })

  // Synchronize transfer status with audio bridge status — intentional derived state update
  useEffect(() => {
    if (!transfer) return
    if (bridgeStatus === 'connected' && transfer.status === 'transferring') {
      setTransfer(prev => prev ? { ...prev, status: 'connected' } : null) // eslint-disable-line react-hooks/set-state-in-effect
    }
    if (bridgeStatus === 'ended' && transfer.status === 'connected') {
      setTransfer(prev => prev ? { ...prev, status: 'ended' } : null)
      toast.info('The transferred call has ended.')
    }
    if (bridgeStatus === 'error') {
      setTransfer(prev => prev ? { ...prev, status: 'failed' } : null)
    }
  }, [bridgeStatus, transfer])

  const handleTransfer = useCallback(async (
    request: {
      requestId: string
      destination: string
      reason?: string
      conversationSummary?: string
      messages?: Array<{ role: string; content: string; timestamp?: string }>
    },
  ) => {
    try {
      const result = await executeTransfer({
        requestId: request.requestId,
        destination: request.destination,
        reason: request.reason,
        conversationSummary: request.conversationSummary,
        messages: request.messages,
      })

      const agentParticipant = Array.from(room.remoteParticipants.values())
        .find(p => p.kind === ParticipantKind.AGENT)

      if (!agentParticipant) {
        console.error('Agent participant not found for AnswerTransferRequest')
        toast.dismiss('transfer-status')
        toast.error('Transfer failed — lost connection to agent.')
        setTransfer(prev => prev ? { ...prev, status: 'failed' } : null)
        return
      }

      await room.localParticipant.performRpc({
        destinationIdentity: agentParticipant.identity,
        method: 'AnswerTransferRequest',
        payload: JSON.stringify({
          requestId: request.requestId,
          accepted: result.accepted,
          reason: result.reason,
        }),
      })

      toast.dismiss('transfer-status')

      if (result.accepted) {
        toast.success('Call transferred — you are now speaking with the destination.')
      } else {
        toast.error(`Transfer failed: ${result.reason || 'Unknown error'}`)
        setTransfer(null)
      }
    } catch (err) {
      console.error('Transfer error:', err)
      toast.dismiss('transfer-status')
      toast.error('Transfer failed due to an unexpected error.')
      setTransfer(prev => prev ? { ...prev, status: 'failed' } : null)

      try {
        const agentParticipant = Array.from(room.remoteParticipants.values())
          .find(p => p.kind === ParticipantKind.AGENT)
        if (agentParticipant) {
          await room.localParticipant.performRpc({
            destinationIdentity: agentParticipant.identity,
            method: 'AnswerTransferRequest',
            payload: JSON.stringify({
              requestId: request.requestId,
              accepted: false,
              reason: 'Transfer failed due to a client error.',
            }),
          })
        }
      } catch {
        // Best effort
      }
    }
  }, [room])

  useEffect(() => {
    if (!room.localParticipant) return

    room.localParticipant.registerRpcMethod('RequestTransfer', async (data) => {
      const request = JSON.parse(data.payload)

      toast.info(`Transferring call to ${request.destination}...`, {
        description: request.reason || undefined,
        duration: Infinity,
        id: 'transfer-status',
      })

      setTransfer({
        requestId: request.requestId,
        destination: request.destination,
        status: 'transferring',
      })

      handleTransfer(request)
      return JSON.stringify({ acknowledged: true })
    })
  }, [room, handleTransfer])

  const handleHangUp = () => {
    if (transfer && (transfer.status === 'connected' || transfer.status === 'transferring')) {
      bridgeHangup()
      setTransfer(prev => prev ? { ...prev, status: 'ended' } : null)
    }
    room.disconnect()
  }

  const isTransferred = transfer && (transfer.status === 'connected' || transfer.status === 'transferring')

  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-3.5rem)] relative bg-grid">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className={`h-64 w-64 rounded-full blur-3xl ${isTransferred ? 'bg-emerald-500/5' : 'bg-primary/5'}`} />
      </div>

      <div className="flex-1 flex items-center justify-center relative">
        {micError ? (
          <div className="flex flex-col items-center gap-4 text-center max-w-md">
            <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <MicOff className="h-8 w-8 text-destructive" />
            </div>
            <h2 className="text-lg font-semibold">Microphone access denied</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Please allow microphone access in your browser settings and try again.
            </p>
          </div>
        ) : isTransferred ? (
          <TransferredCallStatus
            destination={transfer.destination}
            isConnected={transfer.status === 'connected'}
          />
        ) : transfer?.status === 'ended' ? (
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center">
              <PhoneOff className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-bold tracking-tight">Call ended</h2>
            <p className="text-sm text-muted-foreground">
              The transferred call with {transfer.destination} has ended.
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-10">
            <AgentStatus assistantName={assistantName} />
            <UserAudioIndicator />
          </div>
        )}
      </div>

      <div className="absolute bottom-8 left-0 right-0 flex items-center justify-center">
        {micError || transfer?.status === 'ended' || isTransferred ? (
          <HangUpButton onClick={handleHangUp} />
        ) : (
          <CallControls />
        )}
      </div>
    </div>
  )
}

function TransferredCallStatus({
  destination,
  isConnected,
}: {
  destination: string
  isConnected: boolean
}) {
  return (
    <div className="flex flex-col items-center gap-8">
      <div className="flex flex-col items-center gap-4">
        <div className="h-16 w-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center glow-purple" style={{ boxShadow: '0 0 30px rgba(16, 185, 129, 0.15)' }}>
          <User className="h-8 w-8 text-emerald-500" />
        </div>
        <h2 className="text-xl font-bold tracking-tight">{destination}</h2>
        <Badge
          variant={isConnected ? 'default' : 'outline'}
          className={`gap-1.5 ${
            isConnected
              ? 'bg-emerald-500 hover:bg-emerald-500 shadow-sm shadow-emerald-500/20'
              : 'animate-pulse-soft'
          }`}
        >
          {isConnected ? 'Connected' : 'Ringing...'}
        </Badge>
      </div>
      {isConnected && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          Speaking with {destination}
        </div>
      )}
    </div>
  )
}

function HangUpButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant="destructive"
      size="icon"
      className="rounded-full h-14 w-14 shadow-lg shadow-destructive/30"
      onClick={onClick}
    >
      <PhoneOff className="h-5 w-5" />
    </Button>
  )
}
