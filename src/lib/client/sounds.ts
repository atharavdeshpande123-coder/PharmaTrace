'use client'
/**
 * Notification sound utility — generates subtle notification sounds using
 * the Web Audio API (no external files needed).
 *
 * Sounds are opt-in via the Settings page (notifications.soundEnabled).
 */

let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    } catch { return null }
  }
  return audioCtx
}

interface SoundOptions {
  frequency: number
  duration: number
  type?: OscillatorType
  volume?: number
}

function playTone({ frequency, duration, type = 'sine', volume = 0.1 }: SoundOptions) {
  const ctx = getAudioContext()
  if (!ctx) return
  try {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = type
    osc.frequency.value = frequency
    gain.gain.setValueAtTime(0, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + duration)
  } catch { /* ignore audio errors */ }
}

/**
 * Check if sound is enabled (from localStorage settings).
 */
function isSoundEnabled(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const raw = localStorage.getItem('pharmatrace_settings')
    if (!raw) return true // default on
    const settings = JSON.parse(raw)
    return settings?.notifications?.soundEnabled ?? true
  } catch { return true }
}

/**
 * Play a success sound — pleasant ascending two-tone chime.
 */
export function playSuccessSound() {
  if (!isSoundEnabled()) return
  playTone({ frequency: 523.25, duration: 0.15, type: 'sine', volume: 0.08 }) // C5
  setTimeout(() => playTone({ frequency: 783.99, duration: 0.2, type: 'sine', volume: 0.08 }), 100) // G5
}

/**
 * Play an error sound — descending tone.
 */
export function playErrorSound() {
  if (!isSoundEnabled()) return
  playTone({ frequency: 440, duration: 0.1, type: 'square', volume: 0.06 }) // A4
  setTimeout(() => playTone({ frequency: 311.13, duration: 0.15, type: 'square', volume: 0.06 }), 80) // Eb4
}

/**
 * Play a notification sound — gentle single tone.
 */
export function playNotificationSound() {
  if (!isSoundEnabled()) return
  playTone({ frequency: 659.25, duration: 0.12, type: 'sine', volume: 0.06 }) // E5
}

/**
 * Play a warning sound — two-tone amber.
 */
export function playWarningSound() {
  if (!isSoundEnabled()) return
  playTone({ frequency: 587.33, duration: 0.1, type: 'triangle', volume: 0.07 }) // D5
  setTimeout(() => playTone({ frequency: 587.33, duration: 0.1, type: 'triangle', volume: 0.07 }), 150) // D5
}

/**
 * Play a click sound — short blip.
 */
export function playClickSound() {
  if (!isSoundEnabled()) return
  playTone({ frequency: 880, duration: 0.04, type: 'sine', volume: 0.03 })
}
