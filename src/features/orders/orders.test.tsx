import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, expect, test } from 'vitest'
import { FloorPage } from './FloorPage'
import { TakeawayPage } from './TakeawayPage'
import { OrdersPage } from './OrdersPage'
import { viberLink } from './labels'
import { actions, getState } from '@/data/store'
import { TooltipProvider } from '@/components/ui/tooltip'

beforeEach(() => actions.resetDemoData())
const wrap = (ui: React.ReactNode) => render(<MemoryRouter><TooltipProvider>{ui}</TooltipProvider></MemoryRouter>)
const click = (name: string | RegExp) => userEvent.click(screen.getByRole('button', { name }))

test('no open shift: banner, and a free table does not start an order', async () => {
  act(() => { actions.closeShift(0) })
  wrap(<FloorPage />)
  expect(screen.getByText('Open a shift to take orders')).toBeInTheDocument()
  await click(/^T1,/)
  expect(getState().orders.filter((o) => o.tableId === 't1')).toHaveLength(0)
})

test('free table opens a new order; add item and send to kitchen', async () => {
  wrap(<FloorPage />)
  await click(/^T1,/)
  expect(getState().tables.find((t) => t.id === 't1')!.status).toBe('order_open')
  await click(/^Coffee,/)
  await click('Send to kitchen')
  const order = getState().orders.find((o) => o.tableId === 't1')!
  expect(order.status).toBe('sent')
  expect(order.items[0].name).toBe('Coffee')
  expect(order.total).toBe(1200)
})

test('product with options asks which options', async () => {
  wrap(<FloorPage />)
  await click(/^T4,/)
  await click(/^Beef Burger,/)
  await userEvent.click(screen.getByRole('checkbox', { name: /Extra Cheese/ }))
  await click('Add to order')
  const order = getState().orders.find((o) => o.tableId === 't4')!
  expect(order.total).toBe(8000)
})

test('voiding needs a reason', async () => {
  wrap(<FloorPage />)
  await click(/^T5,/)
  await click(/More actions for Chicken Fried Rice/)
  await userEvent.click(screen.getByRole('menuitem', { name: 'Void' }))
  await click('Void item')
  expect(screen.getByText('Enter a reason')).toBeInTheDocument()
  await userEvent.type(screen.getByLabelText('Reason'), 'Wrong dish')
  await click('Void item')
  expect(getState().orders.find((o) => o.id === 'ord-5')!.items[0].status).toBe('void')
})

test('paying a table frees it', async () => {
  wrap(<FloorPage />)
  await click(/^T6,/)
  const total = getState().orders.find((o) => o.id === 'ord-6')!.total
  await click(/^Pay MVR/)
  await click('Card')
  await click('Complete')
  expect(getState().sales[0].total).toBe(total)
  expect(getState().tables.find((t) => t.id === 't6')!.status).toBe('free')
})

test('merge moves one table into another', async () => {
  wrap(<FloorPage />)
  await click('Merge tables')
  await click(/^T3,/)
  await click(/^T2,/)
  expect(getState().orders.find((o) => o.id === 'ord-2')!.items).toHaveLength(4)
  expect(getState().tables.find((t) => t.id === 't3')!.status).toBe('free')
})

test('orders list filters by type', async () => {
  wrap(<OrdersPage />)
  await userEvent.click(screen.getByRole('tab', { name: /^Takeaway/ }))
  const list = screen.getByRole('list', { name: 'Orders' })
  expect(within(list).getAllByRole('listitem')).toHaveLength(1)
  expect(within(list).getByText('Amin')).toBeInTheDocument()
})

test('new takeaway order from Viber', async () => {
  wrap(<TakeawayPage />)
  await click('New takeaway order')
  await userEvent.type(screen.getByLabelText('Customer name'), 'Sara')
  await userEvent.type(screen.getByLabelText('Phone number'), '7771234')
  await userEvent.click(screen.getByRole('radio', { name: 'Viber' }))
  await click('Start order')
  const o = getState().orders.find((x) => x.customerName === 'Sara')!
  expect(o.source).toBe('viber')
  expect(o.type).toBe('takeaway')
})

test('viber link adds the Maldives code', () => {
  expect(viberLink('777 1234')).toBe('viber://chat?number=%2B9607771234')
  expect(viberLink('+960 777 1234')).toBe('viber://chat?number=%2B9607771234')
})
