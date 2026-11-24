import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test, vi } from 'vitest'
import { PaymentDialog } from './PaymentDialog'
import { actions } from '@/data/store'

beforeEach(() => actions.resetDemoData())

async function press(...keys: string[]) {
  for (const k of keys) await userEvent.click(screen.getByRole('button', { name: k }))
}

test('cash less than the total is refused', async () => {
  const onComplete = vi.fn()
  render(<PaymentDialog total={4400} open onOpenChange={() => {}} onComplete={onComplete} />)
  await press('Cash', '4', '0', 'Complete')
  expect(screen.getByText('Amount received is less than the total')).toBeInTheDocument()
  expect(onComplete).not.toHaveBeenCalled()
})

test('cash with change completes', async () => {
  const onComplete = vi.fn()
  render(<PaymentDialog total={4400} open onOpenChange={() => {}} onComplete={onComplete} />)
  await press('Cash', 'MVR 50.00', 'Complete')
  expect(onComplete).toHaveBeenCalledWith([{ method: 'cash', amount: 4400, amountReceived: 5000 }])
})

test('card pays the full total with an optional reference', async () => {
  const onComplete = vi.fn()
  render(<PaymentDialog total={4400} open onOpenChange={() => {}} onComplete={onComplete} />)
  await press('Card')
  await userEvent.type(screen.getByLabelText('Reference (optional)'), '1234')
  await press('Complete')
  expect(onComplete).toHaveBeenCalledWith([{ method: 'card', amount: 4400, reference: '1234' }])
})

test('split payment: part cash, rest card', async () => {
  const onComplete = vi.fn()
  render(<PaymentDialog total={4400} open onOpenChange={() => {}} onComplete={onComplete} />)
  await press('Split payment', 'Cash', '2', '0', 'Add payment')
  expect(screen.getByText('MVR 24.00')).toBeInTheDocument()
  await press('Card', 'Complete')
  expect(onComplete).toHaveBeenCalledWith([
    { method: 'cash', amount: 2000, amountReceived: 2000 },
    { method: 'card', amount: 2400 },
  ])
})
