import { act, renderHook } from '@testing-library/react'
import { beforeEach, expect, test } from 'vitest'
import { useActions, useOpenShift, useProducts } from './hooks'
import { actions as store } from './store'

beforeEach(() => store.resetDemoData())

test('hooks update when an action changes data', async () => {
  const { result } = renderHook(() => ({ products: useProducts(), actions: useActions() }))
  expect(result.current.products.find((p) => p.id === 'p1')!.name).toBe('Coca-Cola 330ml')
  await act(async () => { await result.current.actions.updateProduct('p1', { name: 'Coke' }) })
  expect(result.current.products.find((p) => p.id === 'p1')!.name).toBe('Coke')
})

test('useOpenShift returns null after closing', async () => {
  const { result } = renderHook(() => ({ shift: useOpenShift(), actions: useActions() }))
  expect(result.current.shift?.operator).toBe('Ahmed')
  await act(async () => { await result.current.actions.closeShift(0) })
  expect(result.current.shift).toBeNull()
})
