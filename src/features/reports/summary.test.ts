import { beforeEach, expect, test } from 'vitest'
import { salesSummary } from './summary'
import { actions, getState } from '@/data/store'

beforeEach(() => actions.resetDemoData())
const all: [Date, Date] = [new Date(0), new Date(Date.now() + 86_400_000)]

test('summary of the demo sales', () => {
  const s = salesSummary(getState().sales, ...all)
  expect(s.revenue).toBe(4400 + 2500 + 6300)
  expect(s.count).toBe(3)
  expect(s.average).toBe(4400)
  expect(s.itemsSold).toBe(4 + 1 + 2)
  expect(s.byTender).toEqual({ cash: 4400, qr: 2500, card: 6300, transfer: 0 })
  expect(s.topProducts[0]).toMatchObject({ name: 'Tide Detergent 1kg', qty: 1, revenue: 4500 })
  expect(s.byHour).toHaveLength(24)
})

test('refunds lower revenue', () => {
  const sale = getState().sales.find((x) => x.id === 'sale-2')!
  actions.refundSale(sale.id, [{ saleItemId: sale.items[0].id, quantity: 1 }], 'qr')
  const s = salesSummary(getState().sales, ...all)
  expect(s.revenue).toBe(4400 + 6300)
  expect(s.refunds).toBe(2500)
})
