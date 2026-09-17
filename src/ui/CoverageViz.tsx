import { useEffect, useRef } from 'react'

interface VizState {
  phase: number
  coverage: number
  explored: number
  probes: number
}

// A canvas centerpiece: Phase 2 fills a grid of shipments as coverage climbs;
// Phase 3 lights a starfield as the universe is logged, with streaks on launch.
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

    const stars = Array.from({ length: 520 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: Math.random() * 1.2 + 0.3,
      tw: Math.random() * Math.PI * 2,
    }))
    const streaks: { x: number; y: number; vx: number; vy: number; life: number }[] = []
    const cols = 52
    const rows = 16
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
        stars.forEach((s, i) => {
          const on = i < lit
          const a = on ? 0.55 + 0.45 * Math.sin(t + s.tw) : 0.1
          ctx.globalAlpha = a
          ctx.fillStyle = on ? '#bfe6ff' : '#2a3550'
          ctx.beginPath()
          ctx.arc(s.x * W, s.y * H, s.r, 0, 7)
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
        const total = cols * rows
        const litCount = Math.floor(coverage * total)
        const r = 1.7
        for (let i = 0; i < total; i++) {
          const cx = i % cols
          const cy = Math.floor(i / cols)
          const on = i < litCount
          ctx.globalAlpha = on ? 0.85 : 0.14
          ctx.fillStyle = on ? accent : '#8a8a8a'
          ctx.beginPath()
          ctx.arc(((cx + 0.5) / cols) * W, ((cy + 0.5) / rows) * H, r, 0, 7)
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
