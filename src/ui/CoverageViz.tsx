import { useEffect, useRef } from 'react'

interface VizState {
  phase: number
  coverage: number
  explored: number
  probes: number
}

// Rough continent blobs (normalized 0–1; y increases southward). Dots that fall
// inside any blob are "land", giving a recognizable dotted world map.
const CONTINENTS: [number, number, number, number][] = [
  [0.19, 0.34, 0.12, 0.2], // North America
  [0.31, 0.17, 0.06, 0.1], // Canada / Greenland
  [0.31, 0.72, 0.07, 0.2], // South America
  [0.5, 0.28, 0.06, 0.11], // Europe
  [0.54, 0.6, 0.09, 0.22], // Africa
  [0.72, 0.32, 0.17, 0.18], // Asia
  [0.67, 0.5, 0.05, 0.08], // India / SE Asia
  [0.86, 0.75, 0.08, 0.09], // Australia
]

function isLand(nx: number, ny: number): boolean {
  for (const [cx, cy, rx, ry] of CONTINENTS) {
    const dx = (nx - cx) / rx
    const dy = (ny - cy) / ry
    if (dx * dx + dy * dy <= 1) return true
  }
  return false
}

export function CoverageViz({ phase, coverage, explored, probes }: VizState) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const st = useRef<VizState & { prevProbes: number }>({ phase, coverage, explored, probes, prevProbes: probes })
  st.current.phase = phase
  st.current.coverage = coverage
  st.current.explored = explored
  st.current.probes = probes

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let W = 0
    let H = 0
    const resize = () => {
      W = canvas.clientWidth
      H = canvas.clientHeight
      canvas.width = W * dpr
      canvas.height = H * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    // Land dots, built once, shuffled so coverage spreads organically.
    const land: { nx: number; ny: number }[] = []
    const cols = 100
    const rows = 34
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const nx = (c + 0.5) / cols
        const ny = (r + 0.5) / rows
        if (isLand(nx, ny)) land.push({ nx, ny })
      }
    }
    for (let i = land.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[land[i], land[j]] = [land[j], land[i]]
    }

    const stars = Array.from({ length: 520 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: Math.random() * 1.2 + 0.3,
      tw: Math.random() * Math.PI * 2,
    }))
    const streaks: { x: number; y: number; vx: number; vy: number; life: number }[] = []
    let t = 0
    let accent = '#2f7fd6'
    let frame = 0
    let raf = 0

    const draw = () => {
      const { phase, coverage, explored, probes, prevProbes } = st.current
      if (frame % 30 === 0) {
        accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || accent
      }
      frame++
      t += 0.02
      ctx.clearRect(0, 0, W, H)

      if (phase >= 3) {
        ctx.fillStyle = '#04060b'
        ctx.fillRect(0, 0, W, H)
        const lit = Math.floor(explored * stars.length)
        const drift = (t * 6) % W // slow parallax so the field is always moving
        stars.forEach((s, i) => {
          const on = i < lit
          const x = (s.x * W + drift) % W
          const a = on ? 0.5 + 0.5 * Math.sin(t * 1.3 + s.tw) : 0.08 + 0.06 * Math.sin(t * 0.6 + s.tw)
          ctx.globalAlpha = Math.max(0, a)
          ctx.fillStyle = on ? '#bfe6ff' : '#3a4a68'
          ctx.beginPath()
          ctx.arc(x, s.y * H, on ? s.r * 1.4 : s.r, 0, 7)
          ctx.fill()
        })
        if (probes > prevProbes) {
          for (let k = 0; k < 4; k++) {
            const ang = Math.random() * Math.PI * 2
            streaks.push({ x: W / 2, y: H / 2, vx: Math.cos(ang) * 3.2, vy: Math.sin(ang) * 3.2, life: 1 })
          }
        }
        st.current.prevProbes = probes
        ctx.strokeStyle = '#8fd6ff'
        for (let i = streaks.length - 1; i >= 0; i--) {
          const p = streaks[i]
          ctx.globalAlpha = p.life
          ctx.beginPath()
          ctx.moveTo(p.x, p.y)
          ctx.lineTo(p.x - p.vx * 4, p.y - p.vy * 4)
          ctx.stroke()
          p.x += p.vx
          p.y += p.vy
          p.life -= 0.03
          if (p.life <= 0 || p.x < 0 || p.x > W || p.y < 0 || p.y > H) streaks.splice(i, 1)
        }
        ctx.globalAlpha = 1
      } else {
        const litCount = Math.floor(coverage * land.length)
        for (let i = 0; i < land.length; i++) {
          const p = land[i]
          const on = i < litCount
          ctx.globalAlpha = on ? 0.95 : 0.18
          ctx.fillStyle = on ? accent : '#8fa0b0'
          ctx.beginPath()
          ctx.arc(p.nx * W, p.ny * H, 1.7, 0, 7)
          ctx.fill()
        }
        ctx.globalAlpha = 1
      }
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas ref={canvasRef} className="viz-canvas" aria-hidden />
}
