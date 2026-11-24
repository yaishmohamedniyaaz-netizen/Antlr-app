import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, expect, test } from 'vitest'
import { CloseShiftDialog } from './CloseShiftDialog'
import { ShiftsPage } from './ShiftsPage'
import { expectedCash } from '@/lib/shift'
import { actions, getState } from '@/data/store'

beforeEach(() => actions.resetDemoData())
const open = () => getState().shifts.find((s) => s.status === 'open')!
const press = async (...k: string[]) => { for (const x of k) await userEvent.click(screen.getByRole('button', { name: x })) }

test('expected cash = float + cash sales − cash refunds + pay-ins − pay-outs', () => {
  expect(expectedCash(open())).toBe(54400)
  actions.addCashMovement('pay_out', 400, 'Ice')
  expect(expectedCash(open())).toBe(54000)
})

test('close shift shows expected cash and the variance before confirming', async () => {
  render(<CloseShiftDialog shift={open()} open onOpenChange={() => {}} />)
  expect(screen.getByText('MVR 544.00')).toBeInTheDocument()
  await press('5', '4', '0')
  expect(screen.getByText('Variance -MVR 4.00')).toBeInTheDocument()
  await press('Close shift')
  expect(getState().shifts[0].status).toBe('closed')
  expect(getState().shifts[0].cashVariance).toBe(-400)
})

test('open a new shift with a name and float', async () => {
  act(() => { actions.closeShift(54400) })
  render(<MemoryRouter><ShiftsPage /></MemoryRouter>)
  await press('Open shift')
  await userEvent.type(screen.getByLabelText('Cashier name'), 'Mariyam')
  await press('1', '0', '0', '0', 'Start shift')
  expect(open().operator).toBe('Mariyam')
  expect(open().openingFloat).toBe(100000)
})

test('pay out is recorded with a reason', async () => {
  render(<MemoryRouter><ShiftsPage /></MemoryRouter>)
  await press('Pay out')
  await press('2', '5')
  await userEvent.type(screen.getByLabelText('Reason'), 'Ice')
  await press('Save')
  expect(open().cashMovements[0]).toMatchObject({ type: 'pay_out', amount: 2500, reason: 'Ice' })
})
