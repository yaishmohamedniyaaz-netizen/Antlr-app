import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { expect, test } from 'vitest'
import { Numpad } from './Numpad'

function Harness() {
  const [v, setV] = useState('')
  return <><Numpad value={v} onChange={setV} /><output>{v}</output></>
}

test('typing builds an amount with at most 2 decimals', async () => {
  render(<Harness />)
  for (const k of ['1', '2', '.', '5', '0', '7']) await userEvent.click(screen.getByRole('button', { name: k }))
  expect(screen.getByRole('status')).toHaveTextContent('12.50')
})

test('delete removes the last character and clear empties', async () => {
  render(<Harness />)
  for (const k of ['4', '0']) await userEvent.click(screen.getByRole('button', { name: k }))
  await userEvent.click(screen.getByRole('button', { name: 'Delete' }))
  expect(screen.getByRole('status')).toHaveTextContent('4')
  await userEvent.click(screen.getByRole('button', { name: 'Clear' }))
  expect(screen.getByRole('status')).toHaveTextContent('')
})

test('only one decimal point', async () => {
  render(<Harness />)
  for (const k of ['3', '.', '.', '5']) await userEvent.click(screen.getByRole('button', { name: k }))
  expect(screen.getByRole('status')).toHaveTextContent('3.5')
})
