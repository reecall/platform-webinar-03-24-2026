/**
 * AudioWorklet processor for encoding/decoding mulaw audio.
 *
 * Twilio sends mulaw 8kHz mono audio. This processor:
 * - Decodes incoming mulaw base64 payloads into PCM for playback
 * - Encodes microphone PCM input into mulaw base64 for sending to Twilio
 */

// Mulaw decoding table
const MULAW_DECODE_TABLE = new Int16Array(256)
for (let i = 0; i < 256; i++) {
  let mu = ~i & 0xff
  let sign = mu & 0x80
  let exponent = (mu >> 4) & 0x07
  let mantissa = mu & 0x0f
  let sample = ((mantissa << 3) + 0x84) << exponent
  sample -= 0x84
  MULAW_DECODE_TABLE[i] = sign ? -sample : sample
}

// Mulaw encoding
const MULAW_BIAS = 0x84
const MULAW_MAX = 0x7fff
const MULAW_CLIP = 32635

function encodeMulaw(sample) {
  let sign = 0
  if (sample < 0) {
    sign = 0x80
    sample = -sample
  }
  if (sample > MULAW_CLIP) sample = MULAW_CLIP
  sample += MULAW_BIAS

  let exponent = 7
  let mask = 0x4000
  while (exponent > 0 && !(sample & mask)) {
    exponent--
    mask >>= 1
  }

  let mantissa = (sample >> (exponent + 3)) & 0x0f
  let byte = ~(sign | (exponent << 4) | mantissa) & 0xff
  return byte
}

// Base64 helpers
const B64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
function base64Decode(str) {
  const lookup = new Uint8Array(256)
  for (let i = 0; i < B64_CHARS.length; i++) lookup[B64_CHARS.charCodeAt(i)] = i
  const len = str.length
  let bufLen = (len * 3) >> 2
  if (str[len - 1] === '=') bufLen--
  if (str[len - 2] === '=') bufLen--
  const buf = new Uint8Array(bufLen)
  let p = 0
  for (let i = 0; i < len; i += 4) {
    const a = lookup[str.charCodeAt(i)]
    const b = lookup[str.charCodeAt(i + 1)]
    const c = lookup[str.charCodeAt(i + 2)]
    const d = lookup[str.charCodeAt(i + 3)]
    buf[p++] = (a << 2) | (b >> 4)
    if (p < bufLen) buf[p++] = ((b & 0x0f) << 4) | (c >> 2)
    if (p < bufLen) buf[p++] = ((c & 0x03) << 6) | d
  }
  return buf
}

function base64Encode(bytes) {
  let str = ''
  const len = bytes.length
  for (let i = 0; i < len; i += 3) {
    const a = bytes[i]
    const b = i + 1 < len ? bytes[i + 1] : 0
    const c = i + 2 < len ? bytes[i + 2] : 0
    str += B64_CHARS[(a >> 2) & 0x3f]
    str += B64_CHARS[((a & 0x03) << 4) | ((b >> 4) & 0x0f)]
    str += i + 1 < len ? B64_CHARS[((b & 0x0f) << 2) | ((c >> 6) & 0x03)] : '='
    str += i + 2 < len ? B64_CHARS[c & 0x3f] : '='
  }
  return str
}

class MulawPlaybackProcessor extends AudioWorkletProcessor {
  constructor() {
    super()
    this.buffer = new Float32Array(0)
    this.port.onmessage = (e) => {
      if (e.data.type === 'audio') {
        // Decode mulaw base64 to PCM float32
        const mulawBytes = base64Decode(e.data.payload)
        const pcm = new Float32Array(mulawBytes.length)
        for (let i = 0; i < mulawBytes.length; i++) {
          pcm[i] = MULAW_DECODE_TABLE[mulawBytes[i]] / 32768.0
        }
        // Append to buffer
        const newBuf = new Float32Array(this.buffer.length + pcm.length)
        newBuf.set(this.buffer)
        newBuf.set(pcm, this.buffer.length)
        this.buffer = newBuf
      }
    }
  }

  process(inputs, outputs) {
    const output = outputs[0]
    if (output.length === 0) return true
    const channel = output[0]

    // Twilio sends 8kHz, browser expects 48kHz (or whatever sampleRate is)
    // We need to upsample: for each output sample, pick from buffer at 8000/sampleRate rate
    const ratio = 8000 / sampleRate
    const samplesNeeded = Math.floor(channel.length * ratio)

    if (this.buffer.length < samplesNeeded) {
      // Not enough data, output silence
      channel.fill(0)
      return true
    }

    // Simple linear interpolation upsampling
    for (let i = 0; i < channel.length; i++) {
      const srcIdx = i * ratio
      const idx = Math.floor(srcIdx)
      const frac = srcIdx - idx
      if (idx + 1 < this.buffer.length) {
        channel[i] = this.buffer[idx] * (1 - frac) + this.buffer[idx + 1] * frac
      } else if (idx < this.buffer.length) {
        channel[i] = this.buffer[idx]
      } else {
        channel[i] = 0
      }
    }

    // Remove consumed samples from buffer
    this.buffer = this.buffer.slice(samplesNeeded)
    return true
  }
}

class MulawCaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super()
    this.residual = new Float32Array(0)
  }

  process(inputs) {
    const input = inputs[0]
    if (input.length === 0 || input[0].length === 0) return true
    const channel = input[0]

    // Downsample from sampleRate to 8000Hz
    const ratio = sampleRate / 8000

    // Combine residual with new input
    const combined = new Float32Array(this.residual.length + channel.length)
    combined.set(this.residual)
    combined.set(channel, this.residual.length)

    const outputSamples = Math.floor(combined.length / ratio)
    if (outputSamples === 0) {
      this.residual = combined
      return true
    }

    const mulawBytes = new Uint8Array(outputSamples)
    for (let i = 0; i < outputSamples; i++) {
      const srcIdx = Math.floor(i * ratio)
      const sample = Math.max(-1, Math.min(1, combined[srcIdx]))
      const pcm16 = Math.floor(sample * 32767)
      mulawBytes[i] = encodeMulaw(pcm16)
    }

    const consumed = Math.floor(outputSamples * ratio)
    this.residual = combined.slice(consumed)

    // Send base64-encoded mulaw to main thread
    this.port.postMessage({
      type: 'audio',
      payload: base64Encode(mulawBytes),
    })

    return true
  }
}

registerProcessor('mulaw-playback-processor', MulawPlaybackProcessor)
registerProcessor('mulaw-capture-processor', MulawCaptureProcessor)
