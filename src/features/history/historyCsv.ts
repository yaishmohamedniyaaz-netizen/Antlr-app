import type { Sale } from '@/types'
import { toCsv } from '@/lib/csv'
import { formatAmount } from '@/lib/money'
import { formatDateTime } from '@/lib/format'
import { tenderLabel } from '@/features/checkout/payment'
import { saleStatusLabel } from './labels'

const plain = (l: number) => formatAmount(l).replace(/,/g, '')

export function salesToCsv(sales: Sale[]): string {
  const head = ['Sale number', 'Date', 'Items', 'Subtotal', 'Discount', 'GST', 'Total', 'Paid by', 'Status', 'Operator']
  const rows = sales.map((s) => [
    s.saleNumber, formatDateTime(s.createdAt), String(s.items.reduce((a, i) => a + i.quantity, 0)),
    plain(s.subtotal), plain(s.discountTotal), plain(s.gstAmount), plain(s.total),
    s.payments.map((p) => tenderLabel(p.method)).join(' + '), saleStatusLabel[s.status], s.operator,
  ])
  return toCsv([head, ...rows])
}
