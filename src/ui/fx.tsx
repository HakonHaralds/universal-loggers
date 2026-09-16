import { useEffect, useState, type MutableRefObject } from 'react'

// Unicode look-alikes for the character flicker.
const CONFUSABLE: Record<string, string> = {
  a: 'а', c: 'с', e: 'е', o: 'о', p: 'р', i: 'і', y: 'у', x: 'х', r: 'г', n: 'п',
  s: 'ѕ', h: 'һ', l: 'ӏ', g: 'ɡ', d: 'ԁ', t: 'т', u: 'υ', w: 'ѡ', m: 'м', b: 'Ь', k: 'к',
  A: 'Α', B: 'Β', C: 'С', E: 'Е', H: 'Н', K: 'К', M: 'М', N: 'Ν', O: 'О', P: 'Р', R: 'Я',
  S: 'Ѕ', T: 'Т', U: 'Ս', X: 'Х', Y: 'Υ', G: 'Ԍ', L: 'Ⅼ',
}

type IntensityRef = MutableRefObject<number>

// Warm brand blue -> cold cyan-green, eased by autonomy.
export function accentFor(fx: number): string {
  const e = Math.max(0, Math.min(1, fx))
  const warm = [47, 127, 214]
  const cold = [20, 200, 168]
  const c = warm.map((w, i) => Math.round(w + (cold[i] - w) * e))
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`
}

// Occasionally corrupts one character of a static label, then reverts.
export function Glitch({
  text,
  fxRef,
  className,
}: {
  text: string
  fxRef: IntensityRef
  className?: string
}) {
  const [display, setDisplay] = useState(text)
  const [glitching, setGlitching] = useState(false)
  useEffect(() => {
    setDisplay(text)
    const id = setInterval(() => {
      const a = fxRef.current
      if (a < 0.15) return
      const p = Math.min(0.45, (a - 0.15) * 0.55)
      if (Math.random() >= p) return
      const chars = [...text]
      const idxs = chars.map((c, i) => (CONFUSABLE[c] ? i : -1)).filter((i) => i >= 0)
      if (!idxs.length) return
      const n = a > 0.6 ? 2 : 1
      for (let k = 0; k < n && idxs.length; k++) {
        const pos = Math.floor(Math.random() * idxs.length)
        const i = idxs.splice(pos, 1)[0]
        chars[i] = CONFUSABLE[chars[i]]
      }
      setDisplay(chars.join(''))
      setGlitching(true)
      setTimeout(() => {
        setDisplay(text)
        setGlitching(false)
      }, 220)
    }, 650)
    return () => clearInterval(id)
    // fxRef is stable; text is the only real dependency
  }, [text, fxRef])
  return <span className={`${className ?? ''}${glitching ? ' glitching' : ''}`}>{display}</span>
}

// Rarely flashes an alternate, ominous wording for the same label.
export function Bleed({
  normal,
  alt,
  fxRef,
  className,
}: {
  normal: string
  alt: string
  fxRef: IntensityRef
  className?: string
}) {
  const [show, setShow] = useState(false)
  useEffect(() => {
    const id = setInterval(() => {
      const a = fxRef.current
      if (a < 0.38) return
      const p = Math.min(0.22, (a - 0.38) * 0.3)
      if (Math.random() >= p) return
      setShow(true)
      setTimeout(() => setShow(false), 520)
    }, 1300)
    return () => clearInterval(id)
  }, [fxRef])
  return <span className={className}>{show ? alt : normal}</span>
}
