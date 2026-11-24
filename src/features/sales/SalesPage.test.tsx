import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, expect, test } from 'vitest'
import { SalesPage } from './SalesPage'
import { actions, getState } from '@/data/store'
import { TooltipProvider } from '@/components/ui/tooltip'
import { dispatchCart } from './cartStore'

beforeEach(() => { actions.resetDemoData(); dispatchCart({ type: 'clear' }) })
const renderPage = () => render(<MemoryRouter><TooltipProvider><SalesPage /></TooltipProvider></MemoryRouter>)
const cart = () => screen.getByRole('region', { name: 'Current sale' })

test('no open shift: banner instead of Pay', () => {
  act(() => { actions.closeShift(0) })
  renderPage()
  expect(screen.getByText('Open a shift to start selling')).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: /^Pay/ })).not.toBeInTheDocument()
})

test('scanning a barcode and pressing Enter adds the product', async () => {
  renderPage()
  await userEvent.type(screen.getByRole('searchbox'), '1234567890123{Enter}')
  expect(within(cart()).getByText('Coca-Cola 330ml')).toBeInTheDocument()
  expect(screen.getByRole('searchbox')).toHaveValue('')
})

test('out of stock products cannot be added', () => {
  renderPage()
  expect(screen.getByRole('button', { name: /Cup Noodles/ })).toBeDisabled()
})

test('tap, pay cash, receipt shows and cart clears', async () => {
  renderPage()
  await userEvent.click(screen.getByRole('button', { name: /Coca-Cola 330ml/ }))
  await userEvent.click(screen.getByRole('button', { name: 'Pay MVR 12.00' }))
  await userEvent.click(screen.getByRole('button', { name: 'Cash' }))
  await userEvent.click(screen.getByRole('button', { name: 'MVR 20.00' }))
  await userEvent.click(screen.getByRole('button', { name: 'Complete' }))
  expect(screen.getByRole('heading', { name: 'Receipt' })).toBeInTheDocument()
  expect(getState().sales[0].total).toBe(1200)
  await userEvent.click(screen.getByRole('button', { name: 'Done' }))
  expect(within(cart()).queryByText('Coca-Cola 330ml')).not.toBeInTheDocument()
})

test('the current sale survives leaving the screen', async () => {
  const first = renderPage()
  await userEvent.click(screen.getByRole('button', { name: /Coca-Cola 330ml/ }))
  first.unmount()
  renderPage()
  expect(within(cart()).getByText('Coca-Cola 330ml')).toBeInTheDocument()
})

test('cart uses the current price if a product price changes', async () => {
  renderPage()
  await userEvent.click(screen.getByRole('button', { name: /Coca-Cola 330ml/ }))
  act(() => actions.updateProduct('p1', { price: 1500 }))
  expect(screen.getByRole('button', { name: 'Pay MVR 15.00' })).toBeInTheDocument()
})
