import { expect, test } from 'vitest'
import { cartReducer, cartTotals, emptyCart, toSaleDraft } from './cart'
import { seedState } from '@/data/seed'

const { products, settings } = seedState()
const p = (id: string) => products.find((x) => x.id === id)!

test('adding the same product twice gives quantity 2', () => {
  let s = cartReducer(emptyCart, { type: 'add', product: p('p1') })
  s = cartReducer(s, { type: 'add', product: p('p1') })
  expect(s.lines).toHaveLength(1)
  expect(s.lines[0].quantity).toBe(2)
})

test('setQty to 0 removes the line', () => {
  let s = cartReducer(emptyCart, { type: 'add', product: p('p1') })
  s = cartReducer(s, { type: 'setQty', productId: 'p1', quantity: 0 })
  expect(s.lines).toHaveLength(0)
})

test('totals for Nescafe x2, Vim and Coke', () => {
  let s = emptyCart
  for (const id of ['p4', 'p4', 'p10', 'p1']) s = cartReducer(s, { type: 'add', product: p(id) })
  const t = cartTotals(s, settings)
  expect(t.total).toBe(4400)
  expect(t.gst).toBe(326)
})

test('line discount cannot go below zero and cart discount applies', () => {
  let s = cartReducer(emptyCart, { type: 'add', product: p('p1') })
  s = cartReducer(s, { type: 'setLineDiscount', productId: 'p1', amount: 5000 })
  expect(s.lines[0].lineDiscount).toBe(1200)
  s = cartReducer(s, { type: 'setLineDiscount', productId: 'p1', amount: 200 })
  s = cartReducer(s, { type: 'setCartDiscount', amount: 100 })
  expect(cartTotals(s, settings).total).toBe(900)
})

test('toSaleDraft and load round-trip', () => {
  let s = cartReducer(emptyCart, { type: 'add', product: p('p6') })
  const draft = toSaleDraft(s)
  expect(draft).toEqual({ lines: [{ productId: 'p6', quantity: 1, lineDiscount: 0 }], cartDiscount: 0 })
  s = cartReducer(emptyCart, { type: 'load', draft, products })
  expect(s.lines[0].product.name).toBe('Lays Classic Chips')
})
