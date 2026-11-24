import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test, vi } from 'vitest'
import { DiscountDialog } from './DiscountDialog'
import { ReceiptDialog } from './ReceiptDialog'
import { actions, getState } from '@/data/store'

beforeEach(() => actions.resetDemoData())
const press = async (...k: string[]) => { for (const x of k) await userEvent.click(screen.getByRole('button', { name: x })) }

test('percent discount is worked out from the base amount', async () => {
  const onApply = vi.fn()
  render(<DiscountDialog open onOpenChange={() => {}} baseAmount={4400} onApply={onApply} />)
  await userEvent.click(screen.getByRole('radio', { name: 'Percent' }))
  await press('1', '0', 'Apply discount')
  expect(onApply).toHaveBeenCalledWith(440)
})

test('discount bigger than the amount is refused', async () => {
  const onApply = vi.fn()
  render(<DiscountDialog open onOpenChange={() => {}} baseAmount={4400} onApply={onApply} />)
  await press('5', '0', 'Apply discount')
  expect(screen.getByText('Discount is more than the amount')).toBeInTheDocument()
  expect(onApply).not.toHaveBeenCalled()
})

test('receipt shows sale number, GST line and total', () => {
  const sale = getState().sales.find((s) => s.id === 'sale-1')!
  render(<ReceiptDialog sale={sale} open onOpenChange={() => {}} />)
  expect(screen.getByText(sale.saleNumber)).toBeInTheDocument()
  expect(screen.getByText('Includes GST 8%')).toBeInTheDocument()
  expect(screen.getAllByText('44.00').length).toBeGreaterThan(0)
})
