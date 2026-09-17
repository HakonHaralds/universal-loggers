// Generative ambient engine — fully synthesized, no files. Layered detuned
// pads through a shared filter, a filtered-noise air layer, a feedback-delay
// reverb, slow LFO movement, sparse generative bell tones, and a per-phase
// chord that glides warm → open → cold as the run progresses and autonomy
// climbs. Off/on from the Sound toggle; starts on a user gesture.

// Interval ratios (relative to the root) per phase: warm major, open suspended,
// cold/dissonant.
const CHORDS: Record<number, number[]> = {
  1: [1, 1.5, 2, 2.5198], // root, fifth, octave, major third (8ve up) — warm
  2: [1, 1.3348, 1.5, 2], // root, fourth, fifth, octave — open/suspended
  3: [1, 1.1892, 1.4142, 2], // root, minor third, tritone, octave — cold
}
const ROOTS: Record<number, number> = { 1: 110, 2: 98, 3: 82 }

class AudioEngine {
  private ctx?: AudioContext
  private master?: GainNode
  private filter?: BiquadFilterNode
  private reverbSend?: GainNode
  private pads: { osc: OscillatorNode; gain: GainNode; detune: number }[] = []
  private noiseGain?: GainNode
  private cur = { root: 110, intervals: CHORDS[1], a: 0 }
  on = false

  enable() {
    this.on = true
    if (this.ctx) {
      this.ctx.resume()
      this.master?.gain.setTargetAtTime(0.09, this.ctx.currentTime, 0.5)
      return
    }
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new AC()
    this.ctx = ctx
    // Browsers often create the context suspended even inside a gesture; resume
    // it now, or the first-ever session stays silent until toggled off and on.
    ctx.resume()

    const master = ctx.createGain()
    master.gain.value = 0
    master.connect(ctx.destination)
    this.master = master

    // Feedback-delay reverb bus.
    const delay = ctx.createDelay(1.0)
    delay.delayTime.value = 0.33
    const fb = ctx.createGain()
    fb.gain.value = 0.55
    const damp = ctx.createBiquadFilter()
    damp.type = 'lowpass'
    damp.frequency.value = 2200
    delay.connect(damp)
    damp.connect(fb)
    fb.connect(delay)
    const wet = ctx.createGain()
    wet.gain.value = 0.4
    delay.connect(wet)
    wet.connect(master)
    const reverbSend = ctx.createGain()
    reverbSend.gain.value = 0.5
    reverbSend.connect(delay)
    this.reverbSend = reverbSend

    // Shared pad filter → master (+ reverb send).
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 900
    filter.Q.value = 0.7
    filter.connect(master)
    filter.connect(reverbSend)
    this.filter = filter

    // Four detuned pad voices.
    const detunes = [-7, 5, -3, 9]
    CHORDS[1].forEach((ratio, i) => {
      const osc = ctx.createOscillator()
      osc.type = i === 3 ? 'triangle' : 'sine'
      osc.frequency.value = ROOTS[1] * ratio
      osc.detune.value = detunes[i]
      const gain = ctx.createGain()
      gain.gain.value = [0.5, 0.34, 0.22, 0.18][i]
      osc.connect(gain)
      gain.connect(filter)
      osc.start()
      this.pads.push({ osc, gain, detune: detunes[i] })
    })

    // Filtered-noise air layer.
    const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.5
    const noise = ctx.createBufferSource()
    noise.buffer = buf
    noise.loop = true
    const nband = ctx.createBiquadFilter()
    nband.type = 'bandpass'
    nband.frequency.value = 600
    nband.Q.value = 0.8
    const noiseGain = ctx.createGain()
    noiseGain.gain.value = 0.012
    noise.connect(nband)
    nband.connect(noiseGain)
    noiseGain.connect(master)
    noiseGain.connect(reverbSend)
    noise.start()
    this.noiseGain = noiseGain

    // Slow LFO on the pad filter for movement.
    const lfo = ctx.createOscillator()
    lfo.frequency.value = 0.06
    const lfoDepth = ctx.createGain()
    lfoDepth.gain.value = 180
    lfo.connect(lfoDepth)
    lfoDepth.connect(filter.frequency)
    lfo.start()

    // Sparse generative bell tones (guarded by `on`, so this one interval is
    // harmless while muted).
    setInterval(() => this.bell(), 5500)

    master.gain.linearRampToValueAtTime(0.09, ctx.currentTime + 3)
  }

  disable() {
    this.on = false
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(0, this.ctx.currentTime, 0.4)
  }

  update(a: number, phase: number) {
    this.cur.a = a
    if (!this.ctx || !this.filter || this.pads.length < 4 || !this.on) return
    const now = this.ctx.currentTime
    const intervals = CHORDS[phase] ?? CHORDS[1]
    const root = (ROOTS[phase] ?? 110) - a * 18 // sink with autonomy
    this.cur.root = root
    this.cur.intervals = intervals
    this.pads.forEach((p, i) => {
      p.osc.frequency.setTargetAtTime(root * intervals[i], now, 1.2)
      p.osc.detune.setTargetAtTime(p.detune * (1 + a * 4), now, 1.2) // more beating = more unease
    })
    this.filter.frequency.setTargetAtTime(1050 - a * 720, now, 1.0)
    if (this.noiseGain) this.noiseGain.gain.setTargetAtTime(0.012 + a * 0.03, now, 1.0)
  }

  private bell() {
    if (!this.ctx || !this.reverbSend || !this.master || !this.on) return
    const t = this.ctx.currentTime
    const ratio = this.cur.intervals[1 + Math.floor(Math.random() * (this.cur.intervals.length - 1))]
    const freq = this.cur.root * ratio * 2 // an octave up, softer
    const o = this.ctx.createOscillator()
    o.type = 'sine'
    o.frequency.value = freq
    const g = this.ctx.createGain()
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(0.05, t + 0.6) // slow attack
    g.gain.exponentialRampToValueAtTime(0.001, t + 4)
    o.connect(g)
    g.connect(this.master)
    g.connect(this.reverbSend)
    o.start(t)
    o.stop(t + 4.2)
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
    if (this.reverbSend) g.connect(this.reverbSend)
    o.start(t)
    o.stop(t + dur + 0.02)
  }

  blip() {
    this.ping(760, 0.14, 0.045)
  }

  launch() {
    this.ping(320, 0.4, 0.05, 'triangle')
  }
}

export const audio = new AudioEngine()
