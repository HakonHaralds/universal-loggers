// A tiny procedural audio engine. An ambient drone that starts warm and cools
// into dissonance as autonomy rises; a soft blip for toasts; a launch sound.
// Fully synthesized — no audio files. Off by default; enabled from a user
// gesture (the Sound toggle) so autoplay policy is satisfied.

type Ctx = AudioContext

class AudioEngine {
  private ctx?: Ctx
  private master?: GainNode
  private filter?: BiquadFilterNode
  private oscs: OscillatorNode[] = []
  on = false

  enable() {
    this.on = true
    if (this.ctx) {
      this.ctx.resume()
      this.master?.gain.setTargetAtTime(0.08, this.ctx.currentTime, 0.4)
      return
    }
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new AC()
    this.ctx = ctx
    const master = ctx.createGain()
    master.gain.value = 0
    master.connect(ctx.destination)
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 1000
    filter.Q.value = 0.6
    filter.connect(master)
    this.master = master
    this.filter = filter

    const root = 110
    const voices: [number, OscillatorType, number][] = [
      [root, 'sine', 0.5],
      [root * 1.5, 'sine', 0.32],
      [root * 2, 'sine', 0.2],
      [root * 1.5, 'triangle', 0.18], // detuned mover
    ]
    voices.forEach(([f, type, gain], i) => {
      const o = ctx.createOscillator()
      o.type = type
      o.frequency.value = f
      if (i === 3) o.detune.value = 6
      const g = ctx.createGain()
      g.gain.value = gain
      o.connect(g)
      g.connect(filter)
      o.start()
      this.oscs.push(o)
    })
    master.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 2)
  }

  disable() {
    this.on = false
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(0, this.ctx.currentTime, 0.3)
  }

  update(a: number) {
    if (!this.ctx || !this.filter || this.oscs.length < 4 || !this.on) return
    const now = this.ctx.currentTime
    const root = 110 - a * 30 // sink and darken as autonomy climbs
    this.oscs[0].frequency.setTargetAtTime(root, now, 0.6)
    this.oscs[1].frequency.setTargetAtTime(root * 1.5, now, 0.6)
    this.oscs[2].frequency.setTargetAtTime(root * 2, now, 0.6)
    this.oscs[3].frequency.setTargetAtTime(root * 1.5, now, 0.6)
    this.oscs[3].detune.setTargetAtTime(6 + a * 45, now, 0.6) // more beating = more unease
    this.filter.frequency.setTargetAtTime(1100 - a * 780, now, 0.6)
  }

  private ping(freq: number, dur: number, vol: number, type: OscillatorType = 'sine') {
    if (!this.ctx || !this.master || !this.on) return
    const t = this.ctx.currentTime
    const o = this.ctx.createOscillator()
    o.type = type
    o.frequency.value = freq
    const g = this.ctx.createGain()
    g.gain.setValueAtTime(vol, t)
    g.gain.exponentialRampToValueAtTime(0.001, t + dur)
    o.connect(g)
    g.connect(this.master)
    o.start(t)
    o.stop(t + dur + 0.02)
  }

  blip() {
    this.ping(760, 0.14, 0.05)
  }

  launch() {
    this.ping(320, 0.35, 0.06, 'triangle')
  }
}

export const audio = new AudioEngine()
