import { act, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { beforeEach, expect, test } from 'vitest'
import { ShiftGate } from './ShiftGate'
import { actions } from '@/data/store'

beforeEach(() => actions.resetDemoData())

test('shows children while a shift is open', () => {
  render(<MemoryRouter><ShiftGate><p>Selling</p></ShiftGate></MemoryRouter>)
  expect(screen.getByText('Selling')).toBeInTheDocument()
})

test('shows the open-shift banner when no shift is open', () => {
  act(() => { actions.closeShift(0) })
  render(<MemoryRouter><ShiftGate><p>Selling</p></ShiftGate></MemoryRouter>)
  expect(screen.queryByText('Selling')).not.toBeInTheDocument()
  expect(screen.getByText('Open a shift to start selling')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Open shift' })).toHaveAttribute('href', '/shifts')
})
