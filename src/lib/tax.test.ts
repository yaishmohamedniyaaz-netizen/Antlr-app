import { expect, test } from 'vitest'
import { allocateDiscount, computeTotals } from './tax'

const lines = [{ amount: 1000, gstApplies: true }, { amount: 2200, gstApplies: true }, { amount: 1200, gstApplies: true }]

test('GST included in prices is worked out per line', () => {
  const inc = computeTotals(lines, { rateBps: 800, pricesIncludeGst: true, cartDiscount: 0 })
  expect(inc.lineGst).toEqual([74, 163, 89])
  expect(inc.gst).toBe(326)
  expect(inc.total).toBe(4400)
  expect(inc.gross).toBe(4400)
})

test('GST added on top', () => {
  const exc = computeTotals([{ amount: 1000, gstApplies: true }], { rateBps: 800, pricesIncludeGst: false, cartDiscount: 0 })
  expect(exc.gst).toBe(80)
  expect(exc.total).toBe(1080)
})

test('products without GST add none', () => {
  expect(computeTotals([{ amount: 1000, gstApplies: false }], { rateBps: 800, pricesIncludeGst: false, cartDiscount: 0 }).gst).toBe(0)
})

test('allocateDiscount splits exactly', () => {
  expect(allocateDiscount([1000, 2200, 1200], 440)).toEqual([100, 220, 120])
  expect(allocateDiscount([1, 1, 1], 2).reduce((a, b) => a + b)).toBe(2)
  expect(allocateDiscount([500], 900)).toEqual([500])
  expect(allocateDiscount([], 100)).toEqual([])
})

test('cart discount lowers the total', () => {
  const disc = computeTotals(lines, { rateBps: 800, pricesIncludeGst: true, cartDiscount: 440 })
  expect(disc.discount).toBe(440)
  expect(disc.net).toBe(3960)
  expect(disc.total).toBe(3960)
})

test('rate comes from the argument', () => {
  expect(computeTotals(lines, { rateBps: 1700, pricesIncludeGst: true, cartDiscount: 0 }).gst).toBe(145 + 320 + 174)
})
