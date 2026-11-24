import { expect, test } from 'vitest'
import { localDateKey, minutesSince } from './format'

test('minutesSince counts whole minutes', () => {
  expect(minutesSince('2026-11-23T10:00:00Z', new Date('2026-11-23T10:15:40Z'))).toBe(15)
})

test('localDateKey uses the local calendar date', () => {
  expect(localDateKey(new Date(2026, 10, 3, 23, 59))).toBe('20261103')
})
