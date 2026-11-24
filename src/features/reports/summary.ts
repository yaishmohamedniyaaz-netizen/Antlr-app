import type { Laari, PaymentMethod, Sale, TenderTotals } from '@/types'

export interface SalesSummary {
  revenue: Laari
  refunds: Laari
  count: number
  average: Laari
  itemsSold: number
  byTender: TenderTotals
  topProducts: { productId: string; name: string; qty: number; revenue: Laari }[]
  byHour: { hour: number; revenue: Laari }[]
}

/** Totals for sales made in [from, to). Revenue is after refunds. */
export function salesSummary(sales: Sale[], from: Date, to: Date): SalesSummary {
  const inRange = sales.filter((s) => { const d = new Date(s.createdAt); return d >= from && d < to })
  const byTender: TenderTotals = { cash: 0, card: 0, qr: 0, transfer: 0 }
  const products = new Map<string, { productId: string; name: string; qty: number; revenue: Laari }>()
  const byHour = Array.from({ length: 24 }, (_, hour) => ({ hour, revenue: 0 }))
  let gross = 0, refunds = 0, items = 0
  for (const s of inRange) {
    const refunded = s.refunds.reduce((a, r) => a + r.amount, 0)
    gross += s.total
    refunds += refunded
    for (const p of s.payments) byTender[p.method as PaymentMethod] += p.amount
    for (const r of s.refunds) byTender[r.method] -= r.amount
    byHour[new Date(s.createdAt).getHours()].revenue += s.total - refunded
    for (const i of s.items) {
      const left = i.quantity - i.refundedQty
      items += left
      const e = products.get(i.productId) ?? { productId: i.productId, name: i.productName, qty: 0, revenue: 0 }
      e.qty += left
      e.revenue += i.quantity ? Math.round((i.lineTotal * left) / i.quantity) : 0
      products.set(i.productId, e)
    }
  }
  const revenue = gross - refunds
  return {
    revenue, refunds, count: inRange.length,
    average: inRange.length ? Math.round(revenue / inRange.length) : 0,
    itemsSold: items, byTender,
    topProducts: [...products.values()].filter((p) => p.qty > 0).sort((a, b) => b.revenue - a.revenue || b.qty - a.qty).slice(0, 10),
    byHour,
  }
}
