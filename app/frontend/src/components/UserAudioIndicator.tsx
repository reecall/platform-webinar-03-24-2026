import { useEffect, useRef, useState } from 'react'
import { useLocalParticipant } from '@livekit/components-react'

const BAR_COUNT = 7
const MIN_SCALE = 0.08

export function UserAudioIndicator() {
  const { microphoneTrack, isMicrophoneEnabled } = useLocalParticipant()
  const [levels, setLevels] = useState<number[]>(() => new Array(BAR_COUNT).fill(MIN_SCALE))
  const animFrameRef = useRef<number>(0)

  const mediaStreamTrack = microphoneTrack?.track?.mediaStreamTrack

  useEffect(() => {
    if (!mediaStreamTrack) return

    const audioContext = new AudioContext()
    const source = audioContext.createMediaStreamSource(
      new MediaStream([mediaStreamTrack])
    )
    const analyser = audioContext.createAnalyser()
    analyser.fftSize = 256
    analyser.smoothingTimeConstant = 0.75
    source.connect(analyser)

    const dataArray = new Uint8Array(analyser.frequencyBinCount)
    const step = Math.max(1, Math.floor(analyser.frequencyBinCount / BAR_COUNT))

    const tick = () => {
      analyser.getByteFrequencyData(dataArray)
      const newLevels = new Array(BAR_COUNT)
      for (let i = 0; i < BAR_COUNT; i++) {
        newLevels[i] = Math.max(MIN_SCALE, dataArray[i * step] / 255)
      }
      setLevels(newLevels)
      animFrameRef.current = requestAnimationFrame(tick)
    }
    tick()

    return () => {
      cancelAnimationFrame(animFrameRef.current)
      audioContext.close()
    }
  }, [mediaStreamTrack])

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center justify-center gap-[3px] h-[60px] w-[120px]">
        {levels.map((level, i) => (
          <div
            key={i}
            className="w-[10px] rounded-full transition-[height,opacity] duration-75"
            style={{
              height: `${level * 100}%`,
              opacity: 0.35 + level * 0.65,
              backgroundColor: 'hsl(272, 60%, 55%)',
            }}
          />
        ))}
      </div>
      <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
        {isMicrophoneEnabled ? 'You' : 'Muted'}
      </span>
    </div>
  )
}
