/** Money is always stored as whole laari (1 MVR = 100 laari). */
export type Laari = number

const AMOUNT = /^(\d+)(?:\.(\d{1,2}))?$/

/** Reads a typed MVR amount. Returns null for anything that is not a plain non-negative amount with at most 2 decimals. */
export function parseMvr(input: string): Laari | null {
  const m = AMOUNT.exec(input.trim())
  if (!m) return null
  const whole = Number(m[1])
  const frac = Number((m[2] ?? '').padEnd(2, '0'))
  return whole * 100 + frac
}

/** Rounds n / d half up, for non-negative integers. */
export function divRound(n: number, d: number): number {
  return Math.floor((2 * n + d) / (2 * d))
}

export function formatAmount(l: Laari): string {
  const abs = Math.abs(l)
  const whole = Math.floor(abs / 100).toLocaleString('en-US')
  const frac = String(abs % 100).padStart(2, '0')
  return `${l < 0 ? '-' : ''}${whole}.${frac}`
}

export function formatMvr(l: Laari): string {
  return l < 0 ? `-MVR ${formatAmount(-l)}` : `MVR ${formatAmount(l)}`
}

/** A percentage of an amount, rounded half up. Percent may have up to 2 decimals. */
export function percentOf(amount: Laari, percent: number): Laari {
  const bps = Math.round(percent * 100)
  return divRound(amount * bps, 10000)
}
