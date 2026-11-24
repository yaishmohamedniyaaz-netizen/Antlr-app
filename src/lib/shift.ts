import type { Laari, Shift } from '@/types'

export const payIns = (s: Shift): Laari => s.cashMovements.filter((m) => m.type === 'pay_in').reduce((a, m) => a + m.amount, 0)
export const payOuts = (s: Shift): Laari => s.cashMovements.filter((m) => m.type === 'pay_out').reduce((a, m) => a + m.amount, 0)

/** Cash that should be in the drawer: float + cash sales − cash refunds + pay-ins − pay-outs. */
export const expectedCash = (s: Shift): Laari => s.openingFloat + s.tenderTotals.cash - s.refundTotals.cash + payIns(s) - payOuts(s)
