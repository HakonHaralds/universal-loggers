import { useEffect, useState, type MutableRefObject } from 'react'

// Unicode look-alikes for the rare single-character flicker.
const CONFUSABLE: Record<string, string> = {
  a: 'а', c: 'с', e: 'е', o: 'о', p: 'р', i: 'і', y: 'у', x: 'х',
  A: 'Α', B: 'Β', C: 'С', E: 'Е', H: 'Н', K: 'К', M: 'М', O: 'О', P: 'Р', S: 'Ѕ', T: 'Т',
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
  useEffect(() => {
    setDisplay(text)
    const id = setInterval(() => {
      const a = fxRef.current
      if (a < 0.35) return
      const p = Math.min(0.16, (a - 0.35) * 0.24)
      if (Math.random() >= p) return
      const chars = [...text]
      const idxs = chars.map((c, i) => (CONFUSABLE[c] ? i : -1)).filter((i) => i >= 0)
      if (!idxs.length) return
      const i = idxs[Math.floor(Math.random() * idxs.length)]
      chars[i] = CONFUSABLE[chars[i]]
      setDisplay(chars.join(''))
      setTimeout(() => setDisplay(text), 140)
    }, 850)
    return () => clearInterval(id)
    // fxRef is stable; text is the only real dependency
  }, [text, fxRef])
  return <span className={className}>{display}</span>
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
      if (a < 0.5) return
      const p = Math.min(0.12, (a - 0.5) * 0.2)
      if (Math.random() >= p) return
      setShow(true)
      setTimeout(() => setShow(false), 460)
    }, 1700)
    return () => clearInterval(id)
  }, [fxRef])
  return <span className={className}>{show ? alt : normal}</span>
}
