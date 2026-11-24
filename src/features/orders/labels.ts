import type { Order, OrderItemModifier, OrderStatus, TableStatus, TakeawaySource } from '@/types'

export const orderStatusLabel: Record<OrderStatus, string> = {
  open: 'Open', sent: 'In kitchen', served: 'Served', awaiting_payment: 'Bill requested', paid: 'Paid', voided: 'Cancelled',
}
export const tableStatusLabel: Record<TableStatus, string> = {
  free: 'Free', order_open: 'Ordering', sent: 'In kitchen', served: 'Served', awaiting_payment: 'Bill requested',
}
/** Small status dot colors. Green = free, amber = waiting, grey/dark otherwise. */
export const tableDot: Record<TableStatus, string> = {
  free: 'bg-success', order_open: 'bg-muted-foreground', sent: 'bg-warning', served: 'bg-foreground', awaiting_payment: 'bg-warning',
}
export const orderDot: Record<OrderStatus, string> = {
  open: 'bg-muted-foreground', sent: 'bg-warning', served: 'bg-foreground', awaiting_payment: 'bg-warning', paid: 'bg-success', voided: 'bg-destructive',
}
export const sourceLabel: Record<TakeawaySource, string> = { walkin: 'Walk-in', phone: 'Phone', viber: 'Viber' }

export const isActiveOrder = (o: Order) => o.status !== 'paid' && o.status !== 'voided'

export function orderTitle(o: Order): string {
  if (o.type === 'dine_in') return `Table ${o.tableLabel ?? ''}`.trim()
  return o.customerName ? o.customerName : 'Takeaway'
}

/** Viber chat link with the Maldives code (+960) added when missing. */
export function viberLink(num: string): string {
  const clean = num.replace(/\D/g, '')
  return `viber://chat?number=${encodeURIComponent(clean.startsWith('960') ? '+' + clean : '+960' + clean)}`
}

export const prefixWord = { no: 'No', extra: 'Extra', light: 'Light', side: 'Side of' } as const

export function modifierLabel(m: OrderItemModifier) {
  return `${m.prefix ? prefixWord[m.prefix] + ' ' : ''}${m.label}`
}
