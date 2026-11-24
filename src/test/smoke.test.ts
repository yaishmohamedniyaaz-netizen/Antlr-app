import { expect, test } from 'vitest'
import { cn } from '@/lib/utils'

test('cn joins truthy class names', () => {
  const hidden = ['b'].length === 0
  expect(cn('a', hidden && 'b', 'c')).toBe('a c')
})
