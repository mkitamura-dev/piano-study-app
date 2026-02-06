type AudioState = {
  ctx: AudioContext
}

let audioState: AudioState | undefined

function getAudioContext(): AudioContext {
  if (audioState) return audioState.ctx
  const AudioContextImpl = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AudioContextImpl) throw new Error('Web Audio API is not supported in this browser.')
  const ctx = new AudioContextImpl()
  audioState = { ctx }
  return ctx
}

export async function playTone(frequencyHz: number, durationMs = 700): Promise<void> {
  const ctx = getAudioContext()
  if (ctx.state === 'suspended') await ctx.resume()

  const oscillator = ctx.createOscillator()
  oscillator.type = 'triangle'
  oscillator.frequency.value = frequencyHz

  const gain = ctx.createGain()
  const now = ctx.currentTime
  const attack = 0.01
  const release = 0.12
  const duration = Math.max(0.15, durationMs / 1000)

  gain.gain.setValueAtTime(0.0001, now)
  gain.gain.exponentialRampToValueAtTime(0.18, now + attack)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration - release)

  oscillator.connect(gain)
  gain.connect(ctx.destination)

  oscillator.start(now)
  oscillator.stop(now + duration)
}

