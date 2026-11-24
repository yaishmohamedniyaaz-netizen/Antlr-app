import { divRound, type Laari } from './money'

export interface TaxLine {
  amount: Laari
  gstApplies: boolean
}

export interface Totals {
  gross: Laari
  discount: Laari
  net: Laari
  gst: Laari
  total: Laari
  lineGst: Laari[]
}

/** Splits a discount over amounts in proportion, so the parts add up exactly (largest remainder). */
export function allocateDiscount(amounts: Laari[], discount: Laari): Laari[] {
  const sum = amounts.reduce((a, b) => a + b, 0)
  if (sum === 0) return amounts.map(() => 0)
  const d = Math.min(Math.max(discount, 0), sum)
  const parts = amounts.map((a) => Math.floor((a * d) / sum))
  let left = d - parts.reduce((a, b) => a + b, 0)
  const order = amounts
    .map((a, i) => ({ i, rem: (a * d) % sum }))
    .sort((x, y) => y.rem - x.rem || x.i - y.i)
  for (const { i } of order) {
    if (left === 0) break
    parts[i] += 1
    left -= 1
  }
  return parts
}

export function computeTotals(
  lines: TaxLine[],
  opts: { rateBps: number; pricesIncludeGst: boolean; cartDiscount: Laari },
): Totals {
  const amounts = lines.map((l) => l.amount)
  const gross = amounts.reduce((a, b) => a + b, 0)
  const cut = allocateDiscount(amounts, opts.cartDiscount)
  const discount = cut.reduce((a, b) => a + b, 0)
  const net = gross - discount
  const r = opts.rateBps
  const lineGst = lines.map((l, i) => {
    if (!l.gstApplies) return 0
    const n = l.amount - cut[i]
    return opts.pricesIncludeGst ? divRound(n * r, 10000 + r) : divRound(n * r, 10000)
  })
  const gst = lineGst.reduce((a, b) => a + b, 0)
  return { gross, discount, net, gst, total: opts.pricesIncludeGst ? net : net + gst, lineGst }
}

/** 800 → "8%", 1650 → "16.5%" */
export function formatRate(bps: number): string {
  return `${(bps / 100).toFixed(2).replace(/\.?0+$/, '')}%`
}
