const SUFFIXES = ['', 'k', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc']

export function fmt(n: number): string {
  if (!Number.isFinite(n)) return '∞'
  if (n < 0) return '−' + fmt(-n)
  if (n < 1e6) return Math.floor(n).toLocaleString('en-US')
  let v = n
  let i = 0
  while (v >= 1000 && i < SUFFIXES.length - 1) {
    v /= 1000
    i++
  }
  return `${v.toFixed(2)} ${SUFFIXES[i]}`
}

export function money(n: number): string {
  if (n < 1e6) return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return '$' + fmt(n)
}

export function pct(fraction: number, decimals = 4): string {
  return (fraction * 100).toFixed(decimals) + '%'
}
