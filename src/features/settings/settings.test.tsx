import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { beforeEach, expect, test } from 'vitest'
import { SetupWizard } from './SetupWizard'
import { SettingsPage } from './SettingsPage'
import { actions, getState } from '@/data/store'
import { getDemoNetwork, setDemoNetwork } from '@/data/network'

beforeEach(() => {
  actions.resetDemoData()
  act(() => actions.updateSettings({ guidedSetupDone: false }))
})
const click = (name: string | RegExp) => userEvent.click(screen.getByRole('button', { name }))
const wizard = () => render(
  <MemoryRouter initialEntries={['/floor']}>
    <SetupWizard />
    <Routes><Route path="/sales" element={<p>Sales screen</p>} /><Route path="*" element={null} /></Routes>
  </MemoryRouter>,
)

test('retail skips tables and options, then saves', async () => {
  wizard()
  await click('Get started')
  await userEvent.click(screen.getByRole('radio', { name: /Retail shop/ }))
  await click('Next')
  expect(screen.getByRole('heading', { name: 'Check and finish' })).toBeInTheDocument()
  await click('Finish setup')
  expect(getState().settings).toMatchObject({ businessType: 'retail', guidedSetupDone: true })
  expect(screen.getByText('Sales screen')).toBeInTheDocument()
})

test('restaurant asks for tables and options', async () => {
  wizard()
  await click('Get started')
  await userEvent.click(screen.getByRole('radio', { name: /Restaurant \(dine-in\)/ }))
  await click('Next')
  expect(screen.getByRole('heading', { name: 'How many tables?' })).toBeInTheDocument()
  await click('More tables')
  await click('More tables')
  await click('Next')
  expect(screen.getByRole('heading', { name: 'Dish options' })).toBeInTheDocument()
  await click('Next')
  await click('Finish setup')
  expect(getState().tables).toHaveLength(8)
  expect(getState().settings.businessType).toBe('restaurant')
})

test('GST rate is saved in basis points', async () => {
  render(<MemoryRouter><SettingsPage /></MemoryRouter>)
  await click('Tax')
  const rate = screen.getByLabelText('GST rate (%)')
  await userEvent.clear(rate)
  await userEvent.type(rate, '16.5')
  await click('Save tax settings')
  expect(getState().settings.gstRateBps).toBe(1650)
})

test('deleting a table with an open order shows why it cannot', async () => {
  render(<MemoryRouter><SettingsPage /></MemoryRouter>)
  await click('Tables')
  await click('Delete T2')
  expect(screen.getByText('This table has an open order')).toBeInTheDocument()
  expect(getState().tables.find((t) => t.id === 't2')).toBeDefined()
})

test('Data section can make saves fail, to check error messages', async () => {
  render(<MemoryRouter><SettingsPage /></MemoryRouter>)
  await click('Data')
  await userEvent.click(screen.getByRole('switch', { name: /Make every save fail/ }))
  expect(getDemoNetwork().fail).toBe(true)
  setDemoNetwork({ fail: false })
})
