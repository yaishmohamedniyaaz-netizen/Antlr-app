import type { Laari, OrderItem } from '@/types'
import { computeTotals } from './tax'

/** (unit price + modifier upcharges) × qty. Voided and comped lines count as 0. */
export function orderLineAmount(item: Pick<OrderItem, 'unitPrice' | 'qty' | 'modifiers' | 'status'>): Laari {
  if (item.status !== 'active') return 0
  const each = item.unitPrice + item.modifiers.reduce((s, m) => s + m.upcharge, 0)
  return each * item.qty
}

export function orderTotals(
  items: OrderItem[],
  gstApplies: (productId: string) => boolean,
  opts: { rateBps: number; pricesIncludeGst: boolean },
) {
  const t = computeTotals(
    items.map((i) => ({ amount: orderLineAmount(i), gstApplies: gstApplies(i.productId) })),
    { ...opts, cartDiscount: 0 },
  )
  return { subtotal: t.net, gstAmount: t.gst, total: t.total }
}
