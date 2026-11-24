import { renderHook, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { useActions } from './hooks'
import { setDemoNetwork, SAVE_FAILED_MESSAGE } from './network'
import { actions as store, getState } from './store'
import { PaymentDialog } from '@/features/checkout/PaymentDialog'

beforeEach(() => { store.resetDemoData(); setDemoNetwork({ fail: false }) })
afterEach(() => setDemoNetwork({ fail: false }))

test('actions are async and resolve with the result', async () => {
  const { result } = renderHook(() => useActions())
  const p = result.current.updateProduct('p1', { name: 'Coke' })
  expect(p).toBeInstanceOf(Promise)
  await p
  expect(getState().products.find((x) => x.id === 'p1')!.name).toBe('Coke')
})

test('with failing saves turned on, actions reject and change nothing', async () => {
  setDemoNetwork({ fail: true })
  const { result } = renderHook(() => useActions())
  await expect(result.current.updateProduct('p1', { name: 'Coke' })).rejects.toThrow(SAVE_FAILED_MESSAGE)
  expect(getState().products.find((x) => x.id === 'p1')!.name).toBe('Coca-Cola 330ml')
})

test('payment shows Saving… and then the error when the save fails', async () => {
  let reject!: (e: Error) => void
  const onComplete = vi.fn(() => new Promise<void>((_, r) => { reject = r }))
  render(<PaymentDialog total={1200} open onOpenChange={() => {}} onComplete={onComplete} />)
  await userEvent.click(screen.getByRole('button', { name: 'Card' }))
  await userEvent.click(screen.getByRole('button', { name: 'Complete' }))
  expect(screen.getByRole('button', { name: 'Saving…' })).toBeDisabled()
  reject(new Error(SAVE_FAILED_MESSAGE))
  expect(await screen.findByText(SAVE_FAILED_MESSAGE)).toBeInTheDocument()
  await waitFor(() => expect(screen.getByRole('button', { name: 'Complete' })).toBeEnabled())
})
