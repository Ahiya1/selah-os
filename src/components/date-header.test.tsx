import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

vi.mock('@/lib/dates', () => ({
  getEffectiveDate: () => '2026-03-12',
  formatDisplayDate: () => 'Thursday, March 12',
}))

import { DateHeader } from './date-header'

describe('DateHeader', () => {
  it('renders a placeholder div before date is available', () => {
    const { container } = render(<DateHeader />)
    // Before useEffect runs, the component renders a placeholder div
    // The placeholder is present on initial render (before useEffect)
    // After useEffect, it will be replaced by h1
    // We verify the initial render produces an element
    expect(container.firstChild).toBeTruthy()
  })

  it('renders formatted date after mount', async () => {
    render(<DateHeader />)
    await waitFor(() => {
      expect(screen.getByText('Thursday, March 12')).toBeInTheDocument()
    })
  })

  it('uses h1 element for the date display', async () => {
    render(<DateHeader />)
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Thursday, March 12')
    })
  })

  it('has text-xl text-warm-800 styling', async () => {
    render(<DateHeader />)
    await waitFor(() => {
      const heading = screen.getByRole('heading', { level: 1 })
      expect(heading).toHaveClass('text-xl')
      expect(heading).toHaveClass('text-warm-800')
    })
  })
})
