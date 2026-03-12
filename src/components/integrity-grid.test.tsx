import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { IntegrityGrid } from './integrity-grid'
import type { DayIntegrity } from '@/hooks/use-ground-integrity'

function makeDays(overrides?: Partial<DayIntegrity>[]): DayIntegrity[] {
  const base: DayIntegrity = {
    date: '2026-03-06',
    sleep: false,
    food: false,
    medication: false,
    body: false,
    ground: false,
  }
  return Array.from({ length: 7 }, (_, i) => ({
    ...base,
    date: `2026-03-${String(6 + i).padStart(2, '0')}`,
    ...(overrides?.[i] ?? {}),
  }))
}

describe('IntegrityGrid', () => {
  it('renders 5 anchor row labels', () => {
    render(<IntegrityGrid days={makeDays()} />)
    expect(screen.getByText('sleep')).toBeInTheDocument()
    expect(screen.getByText('food')).toBeInTheDocument()
    expect(screen.getByText('medication')).toBeInTheDocument()
    expect(screen.getByText('body')).toBeInTheDocument()
    expect(screen.getByText('ground')).toBeInTheDocument()
  })

  it('renders 35 dot indicators (5 anchors x 7 days)', () => {
    render(<IntegrityGrid days={makeDays()} />)
    const cells = screen.getAllByRole('cell')
    expect(cells).toHaveLength(35)
  })

  it('renders filled dots for completed anchors', () => {
    const days = makeDays()
    days[6] = { ...days[6], sleep: true, food: true }
    render(<IntegrityGrid days={days} />)

    const sleepDone = screen.getByLabelText('sleep 2026-03-12: done')
    expect(sleepDone.className).toContain('bg-green-600')

    const sleepNotDone = screen.getByLabelText('sleep 2026-03-06: not done')
    expect(sleepNotDone.className).toContain('bg-warm-300')
  })

  it('has table role with aria-label', () => {
    render(<IntegrityGrid days={makeDays()} />)
    expect(screen.getByRole('table')).toHaveAttribute('aria-label', 'Ground integrity')
  })

  it('renders day-of-week labels', () => {
    render(<IntegrityGrid days={makeDays()} />)
    // The narrow weekday format renders single characters (M, T, W, etc.)
    // Just check that 7 day labels exist in the header row
    const grid = screen.getByRole('table')
    const firstRow = grid.children[0]
    // 1 empty + 7 day labels
    expect(firstRow.children).toHaveLength(8)
  })
})
