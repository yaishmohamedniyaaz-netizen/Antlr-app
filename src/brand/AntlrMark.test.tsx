import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { AntlrMark } from './AntlrMark'
import { AntlrLogo } from './AntlrLogo'
import { MARK_VIEWBOX, SMALL_VIEWBOX, TINY_VIEWBOX } from './logoPaths'

test('mark is a labelled svg', () => {
  render(<AntlrMark size={48} />)
  const svg = screen.getByRole('img', { name: 'Antlr' })
  expect(svg.tagName.toLowerCase()).toBe('svg')
  expect(svg.getAttribute('viewBox')).toBe(MARK_VIEWBOX)
})

test('mark uses the 16-pixel version at 18 px and below', () => {
  render(<AntlrMark size={16} />)
  expect(screen.getByRole('img', { name: 'Antlr' }).getAttribute('viewBox')).toBe(TINY_VIEWBOX)
})

test('mark switches to the small version at 24 px and below', () => {
  render(<AntlrMark size={24} />)
  expect(screen.getByRole('img', { name: 'Antlr' }).getAttribute('viewBox')).toBe(SMALL_VIEWBOX)
})

test('logo shows the mark and the word', () => {
  render(<AntlrLogo height={28} />)
  expect(screen.getByRole('img', { name: 'Antlr' })).toBeInTheDocument()
})

test('logo snaps small marks to exact pixel sizes', () => {
  render(<AntlrLogo height={14} />)
  const mark = screen.getByRole('img', { name: 'Antlr' })
  expect(mark.getAttribute('height')).toBe('16')
  expect(mark.getAttribute('viewBox')).toBe(TINY_VIEWBOX)
})
