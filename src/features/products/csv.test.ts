import { expect, test } from 'vitest'
import { parseCsv, toCsv } from '@/lib/csv'
import { PRODUCT_CSV_HEADER, parseProductCsv, productCsvTemplate } from './csv'
import { seedState } from '@/data/seed'

const { categories } = seedState()

test('toCsv quotes fields that need it', () => {
  expect(toCsv([['a,b', 'c']])).toBe('"a,b",c')
  expect(toCsv([['say "hi"', 'x\ny']])).toBe('"say ""hi""","x\ny"')
})

test('parseCsv reads quoted fields', () => {
  expect(parseCsv('a,"b,c",d\n"e ""f""",g')).toEqual([['a', 'b,c', 'd'], ['e "f"', 'g']])
})

test('template row imports cleanly', () => {
  const { rows, errors } = parseProductCsv(productCsvTemplate(), categories)
  expect(errors).toEqual([])
  expect(rows[0]).toMatchObject({ name: 'Coca-Cola 330ml', categoryId: 'cat-1', price: 1200, costPrice: 950, trackStock: true, currentStock: 24, gstApplicable: true })
})

test('bad prices and unknown categories are reported by line', () => {
  const text = [PRODUCT_CSV_HEADER, 'A,Beverages,"1,200",,,false,0,true', 'B,Beverages,-5,,,false,0,true', 'C,Nope,5,,,false,0,true', 'D,Snacks,5,,,false,0,true'].join('\n')
  const { rows, errors } = parseProductCsv(text, categories)
  expect(errors.map((e) => e.line)).toEqual([2, 3, 4])
  expect(errors[0].message).toBe('Price is not a valid amount')
  expect(errors[2].message).toBe('Unknown category "Nope"')
  expect(rows.map((r) => r.name)).toEqual(['D'])
})

test('wrong header is reported', () => {
  expect(parseProductCsv('foo,bar\n1,2', categories).errors[0]).toEqual({ line: 1, message: 'The first line must be the template header' })
})
