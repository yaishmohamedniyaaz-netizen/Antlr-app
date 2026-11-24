import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, expect, test, vi } from 'vitest'
import { ProductSheet } from './ProductSheet'
import { CategoryDialog } from './CategoryDialog'
import { ProductsPage } from './ProductsPage'
import { actions, getState } from '@/data/store'

beforeEach(() => actions.resetDemoData())

test('invalid price is refused', async () => {
  const onSave = vi.fn()
  render(<ProductSheet open product={null} onOpenChange={() => {}} onSave={onSave} />)
  await userEvent.type(screen.getByLabelText('Name'), 'Tuna roll')
  await userEvent.type(screen.getByLabelText('Price (MVR)'), '12.505')
  await userEvent.click(screen.getByRole('button', { name: 'Save product' }))
  expect(screen.getByText('Enter a valid price')).toBeInTheDocument()
  expect(onSave).not.toHaveBeenCalled()
})

test('valid product is saved in laari', async () => {
  const onSave = vi.fn()
  render(<ProductSheet open product={null} onOpenChange={() => {}} onSave={onSave} />)
  await userEvent.type(screen.getByLabelText('Name'), 'Tuna roll')
  await userEvent.type(screen.getByLabelText('Price (MVR)'), '12.5')
  await userEvent.click(screen.getByRole('button', { name: 'Save product' }))
  expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ name: 'Tuna roll', price: 1250, categoryId: 'cat-1' }))
})

test('deleting a category with products asks where to move them', async () => {
  render(<CategoryDialog open onOpenChange={() => {}} />)
  await userEvent.click(screen.getByRole('button', { name: 'Delete Beverages' }))
  expect(screen.getByText(/5 products use this category/)).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: 'Move and delete' }))
  expect(getState().categories.find((c) => c.id === 'cat-1')).toBeUndefined()
  expect(getState().products.find((p) => p.id === 'p1')!.categoryId).toBe('cat-2')
})

test('bulk hide selected products', async () => {
  render(<MemoryRouter><ProductsPage /></MemoryRouter>)
  const table = screen.getByRole('table')
  await userEvent.click(within(table).getByRole('checkbox', { name: 'Select Sprite 330ml' }))
  await userEvent.click(within(table).getByRole('checkbox', { name: 'Select Oreo Original' }))
  await userEvent.click(screen.getByRole('button', { name: 'Hide' }))
  expect(getState().products.filter((p) => p.isHidden).map((p) => p.id).sort()).toEqual(['p2', 'p8'])
})

test('?edit= opens the product sheet', () => {
  render(<MemoryRouter initialEntries={['/products?edit=p3']}><ProductsPage /></MemoryRouter>)
  expect(screen.getByLabelText('Name')).toHaveValue('Red Bull 250ml')
})
