import { useLocalParticipant, useRoomContext } from '@livekit/components-react'
import { Mic, MicOff, PhoneOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

export function CallControls() {
  const { localParticipant, isMicrophoneEnabled } = useLocalParticipant()
  const room = useRoomContext()

  const toggleMute = () => {
    localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled)
  }

  const handleHangUp = () => {
    room.disconnect()
  }

  return (
    <TooltipProvider>
      <div className="flex items-center gap-4 bg-card/80 backdrop-blur-lg rounded-full px-4 py-2 border border-border/50 shadow-lg">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className={`rounded-full border-border/50 ${!isMicrophoneEnabled ? 'bg-muted text-muted-foreground' : 'hover:bg-accent'}`}
              onClick={toggleMute}
            >
              {isMicrophoneEnabled ? (
                <Mic className="h-5 w-5" />
              ) : (
                <MicOff className="h-5 w-5" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{isMicrophoneEnabled ? 'Mute' : 'Unmute'}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="destructive"
              size="icon"
              className="rounded-full h-14 w-14 shadow-lg shadow-destructive/30"
              onClick={handleHangUp}
            >
              <PhoneOff className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Hang up</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  )
}
