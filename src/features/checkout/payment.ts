import type { Laari, PaymentMethod } from '@/types'

export function changeDue(total: Laari, received: Laari): Laari | null {
  return received < total ? null : received - total
}

/** Exact amount, then the next round 10 / 50 / 100 / 500 MVR above it. */
export function quickCashAmounts(total: Laari): Laari[] {
  const out = [total]
  for (const note of [1000, 5000, 10000, 50000]) {
    const up = Math.ceil(total / note) * note
    if (up > total && !out.includes(up)) out.push(up)
  }
  return out.slice(0, 4)
}

const LABELS: Record<PaymentMethod, string> = { qr: 'QR', card: 'Card', transfer: 'Bank transfer', cash: 'Cash' }
export const tenderLabel = (m: PaymentMethod) => LABELS[m]
