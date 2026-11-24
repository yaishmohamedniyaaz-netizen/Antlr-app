import { expect, test } from 'vitest'
import { defaultPathFor, navItemsFor } from './nav'

const labels = (t: Parameters<typeof navItemsFor>[0]) => navItemsFor(t).map((i) => i.label)

test('retail shows the shop screens only', () => {
  expect(labels('retail')).toEqual(['Sales', 'Products', 'History', 'Shifts', 'Reports', 'Settings'])
})
test('restaurant with takeaway shows everything', () => {
  expect(labels('restaurant_takeaway')).toEqual(['Floor', 'Orders', 'Takeaway', 'Sales', 'Products', 'History', 'Shifts', 'Reports', 'Settings'])
})
test('takeaway only has no floor and no sales', () => {
  expect(labels('takeaway')).toEqual(['Orders', 'Takeaway', 'Products', 'History', 'Shifts', 'Reports', 'Settings'])
})
test('default screen per business type', () => {
  expect(defaultPathFor('retail')).toBe('/sales')
  expect(defaultPathFor('takeaway')).toBe('/takeaway')
  expect(defaultPathFor('restaurant')).toBe('/floor')
})
