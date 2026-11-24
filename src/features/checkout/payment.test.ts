import { expect, test } from 'vitest'
import { changeDue, quickCashAmounts, tenderLabel } from './payment'
import { formatRate } from '@/lib/tax'

test('changeDue', () => {
  expect(changeDue(4400, 5000)).toBe(600)
  expect(changeDue(4400, 4400)).toBe(0)
  expect(changeDue(4400, 4000)).toBeNull()
})

test('quickCashAmounts gives exact then common notes above the total', () => {
  expect(quickCashAmounts(4400)).toEqual([4400, 5000, 10000, 50000])
  expect(quickCashAmounts(5000)).toEqual([5000, 10000, 50000])
})

test('tender labels and GST rate label', () => {
  expect(tenderLabel('transfer')).toBe('Bank transfer')
  expect(formatRate(800)).toBe('8%')
  expect(formatRate(1650)).toBe('16.5%')
})
