import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { HistoryPage } from './HistoryPage'
import { RefundDialog } from './RefundDialog'
import { actions, getState } from '@/data/store'
import { salesToCsv } from './historyCsv'

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 10, 23, 14, 0))
  actions.resetDemoData()
})
afterEach(() => vi.useRealTimers())

test('refund quantity is capped at what was sold', async () => {
  const sale = getState().sales.find((s) => s.id === 'sale-2')! // 1 x Red Bull, QR
  render(<RefundDialog sale={sale} open onOpenChange={() => {}} />)
  const plus = screen.getByRole('button', { name: 'More Red Bull 250ml' })
  await userEvent.click(plus)
  expect(plus).toBeDisabled()
  await userEvent.type(screen.getByLabelText('Reason (optional)'), 'Warm can')
  await userEvent.click(screen.getByRole('button', { name: 'Refund MVR 25.00' }))
  const after = getState().sales.find((s) => s.id === 'sale-2')!
  expect(after.status).toBe('refunded')
  expect(after.refunds[0].lines[0].quantity).toBe(1)
  expect(after.refunds[0].method).toBe('qr')
})

test('nothing chosen: refund is refused with a message', async () => {
  const sale = getState().sales.find((s) => s.id === 'sale-2')!
  render(<RefundDialog sale={sale} open onOpenChange={() => {}} />)
  await userEvent.click(screen.getByRole('button', { name: 'Refund MVR 0.00' }))
  expect(screen.getByText('Choose at least one item to refund')).toBeInTheDocument()
})

test('a fully refunded sale has no Refund action', async () => {
  const sale = getState().sales.find((s) => s.id === 'sale-2')!
  actions.refundSale(sale.id, [{ saleItemId: sale.items[0].id, quantity: 1 }], 'qr')
  render(<MemoryRouter><HistoryPage /></MemoryRouter>)
  const row = screen.getByRole('button', { name: new RegExp(sale.saleNumber) })
  await userEvent.click(row)
  const details = screen.getByRole('region', { name: `Sale ${sale.saleNumber}` })
  expect(within(details).queryByRole('button', { name: 'Refund' })).not.toBeInTheDocument()
  expect(within(details).getByRole('button', { name: 'Reprint receipt' })).toBeInTheDocument()
})

test('CSV export has one row per sale with plain amounts', () => {
  const csv = salesToCsv(getState().sales)
  const lines = csv.split('\n')
  expect(lines[0]).toBe('Sale number,Date,Items,Subtotal,Discount,GST,Total,Paid by,Status,Operator')
  expect(lines).toHaveLength(4)
  expect(lines.find((l) => l.startsWith('ANTLR-20261123-001'))).toContain(',44.00,')
})
