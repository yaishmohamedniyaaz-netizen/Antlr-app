import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { actions, getState } from './store'
import { orderLineAmount } from '@/lib/orderMath'
import type { SaleDraft } from '@/types'

const cartOf = (lines: [string, number][], cartDiscount = 0): SaleDraft => ({
  lines: lines.map(([productId, quantity]) => ({ productId, quantity, lineDiscount: 0 })),
  cartDiscount,
})

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(2026, 10, 23, 10, 0, 0))
  actions.resetDemoData()
})
afterEach(() => vi.useRealTimers())

test('completeSale numbers sales per day and lowers stock', () => {
  const s = actions.completeSale(cartOf([['p1', 2]]), [{ method: 'cash', amount: 2400, amountReceived: 3000 }])
  expect(s.saleNumber).toBe('ANTLR-20261123-004')
  expect(getState().products.find((p) => p.id === 'p1')!.currentStock).toBe(22)
  expect(s.total).toBe(2400)
  expect(s.gstAmount).toBe(178)
  expect(s.payments[0].changeGiven).toBe(600)
  expect(getState().sales[0].id).toBe(s.id)
})

test('completeSale adds payments to the open shift', () => {
  actions.completeSale(cartOf([['p3', 1]]), [{ method: 'card', amount: 2500 }])
  const shift = getState().shifts.find((x) => x.status === 'open')!
  expect(shift.tenderTotals.card).toBe(6300 + 2500)
})

test('completeSale without an open shift throws', () => {
  actions.closeShift(54400)
  expect(() => actions.completeSale(cartOf([['p1', 1]]), [{ method: 'cash', amount: 1200 }])).toThrow('No open shift')
})

test('closeShift stores expected cash and variance', () => {
  const closed = actions.closeShift(54000)
  expect(closed.expectedCash).toBe(54400)
  expect(closed.cashVariance).toBe(-400)
  expect(closed.status).toBe('closed')
})

test('cash movements change expected cash', () => {
  actions.addCashMovement('pay_in', 1000, 'Change from bank')
  actions.addCashMovement('pay_out', 300, 'Ice')
  expect(actions.closeShift(55100).cashVariance).toBe(0)
})

test('refundSale restores stock and marks partial refunds', () => {
  const s = actions.completeSale(cartOf([['p1', 2], ['p6', 1]]), [{ method: 'cash', amount: 3900 }])
  const line = s.items.find((i) => i.productId === 'p1')!
  const after = actions.refundSale(s.id, [{ saleItemId: line.id, quantity: 1 }], 'cash', 'Damaged')
  expect(after.status).toBe('partially_refunded')
  expect(after.refunds[0].amount).toBe(1200)
  expect(getState().products.find((p) => p.id === 'p1')!.currentStock).toBe(23)
  expect(getState().shifts.find((x) => x.status === 'open')!.refundTotals.cash).toBe(1200)
})

test('refunding more than was sold throws', () => {
  const s = actions.completeSale(cartOf([['p1', 1]]), [{ method: 'cash', amount: 1200 }])
  expect(() => actions.refundSale(s.id, [{ saleItemId: s.items[0].id, quantity: 2 }], 'cash')).toThrow('Refund is more than was sold')
})

test('paying a table order frees the table', () => {
  const order = getState().orders.find((o) => o.id === 'ord-6')!
  const sale = actions.payOrder('ord-6', [{ method: 'card', amount: order.total }])
  expect(sale.orderId).toBe('ord-6')
  expect(sale.total).toBe(order.total)
  expect(getState().orders.find((o) => o.id === 'ord-6')!.status).toBe('paid')
  const t6 = getState().tables.find((t) => t.id === 't6')!
  expect(t6.status).toBe('free')
  expect(t6.currentOrderId).toBeUndefined()
})

test('creating a table order marks the table busy', () => {
  const o = actions.createOrder({ type: 'dine_in', tableId: 't1', peopleCount: 2 })
  const t1 = getState().tables.find((t) => t.id === 't1')!
  expect(t1.status).toBe('order_open')
  expect(t1.currentOrderId).toBe(o.id)
  expect(o.tableLabel).toBe('T1')
})

test('mergeOrders moves items and frees the source table', () => {
  actions.mergeOrders('ord-3', 'ord-2')
  const target = getState().orders.find((o) => o.id === 'ord-2')!
  expect(target.items).toHaveLength(4)
  expect(getState().orders.find((o) => o.id === 'ord-3')).toBeUndefined()
  expect(getState().tables.find((t) => t.id === 't3')!.status).toBe('free')
})

test('voiding an order item removes it from the total', () => {
  const before = getState().orders.find((o) => o.id === 'ord-5')!
  const item = before.items[0]
  actions.setOrderItemStatus('ord-5', item.id, 'void', 'Wrong order')
  const after = getState().orders.find((o) => o.id === 'ord-5')!
  expect(after.total).toBe(before.total - orderLineAmount(item))
})

test('deleteTable with an open order throws', () => {
  expect(() => actions.deleteTable('t2')).toThrow('This table has an open order')
})

test('deleteCategory with products needs a target category', () => {
  expect(() => actions.deleteCategory('cat-1')).toThrow('Category has products')
  actions.deleteCategory('cat-1', 'cat-2')
  expect(getState().products.find((p) => p.id === 'p1')!.categoryId).toBe('cat-2')
})

test('orderLineAmount includes modifier upcharges and ignores voided lines', () => {
  const burger = { id: 'x', productId: 'pr7', name: 'Beef Burger', unitPrice: 7500, qty: 2, modifiers: [{ label: 'Cheese', prefix: 'extra' as const, upcharge: 500 }], status: 'active' as const }
  expect(orderLineAmount(burger)).toBe(16000)
  expect(orderLineAmount({ ...burger, status: 'void' })).toBe(0)
})

test('setTableCount adds numbered tables and only removes free ones', () => {
  actions.setTableCount(8)
  expect(getState().tables.map((t) => t.label)).toEqual(['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8'])
  actions.setTableCount(2)
  // T2, T3, T5, T6 have open orders and stay
  expect(getState().tables.map((t) => t.label)).toEqual(['T2', 'T3', 'T5', 'T6'])
})
