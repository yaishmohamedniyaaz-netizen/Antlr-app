import { describe, expect, test } from 'vitest'
import { formatAmount, formatMvr, parseMvr, percentOf } from './money'

describe('parseMvr', () => {
  test('reads whole and decimal amounts as laari', () => {
    expect(parseMvr('12')).toBe(1200)
    expect(parseMvr('12.5')).toBe(1250)
    expect(parseMvr('12.50')).toBe(1250)
    expect(parseMvr(' 0.05 ')).toBe(5)
  })
  test('rejects invalid input', () => {
    for (const bad of ['', '  ', '-5', '12.505', '1,200', 'abc', '.', '1e3']) expect(parseMvr(bad)).toBeNull()
  })
})

test('formatMvr and formatAmount', () => {
  expect(formatMvr(123450)).toBe('MVR 1,234.50')
  expect(formatMvr(0)).toBe('MVR 0.00')
  expect(formatMvr(-374)).toBe('-MVR 3.74')
  expect(formatAmount(123450)).toBe('1,234.50')
})

test('percentOf rounds half up', () => {
  expect(percentOf(4400, 10)).toBe(440)
  expect(percentOf(105, 10)).toBe(11)
})
