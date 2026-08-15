import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Journey, buildRidgePath, ridgeWindow, smoothHeights } from './journey'
import type { JourneyDay } from '@/hooks/use-journey'

const day = (date: string, held: number): JourneyDay => ({ date, held })
const held = (values: number[]): JourneyDay[] =>
  values.map((h, i) => day(`d${i}`, h))

describe('ridgeWindow', () => {
  it('reads a short journey day by day', () => {
    expect(ridgeWindow(14)).toBe(1)
    expect(ridgeWindow(50)).toBe(1)
  })

  it('widens as the journey grows, keeping the grain about the same', () => {
    expect(ridgeWindow(200)).toBe(4)
    expect(ridgeWindow(365)).toBe(7)
    expect(ridgeWindow(3650)).toBe(73)
  })

  it('never collapses to nothing', () => {
    expect(ridgeWindow(0)).toBe(1)
    expect(ridgeWindow(1)).toBe(1)
  })
})

describe('smoothHeights', () => {
  it('leaves a day-by-day reading untouched', () => {
    expect(smoothHeights(held([5, 0, 3]), 1)).toEqual([5, 0, 3])
  })

  it('narrows the window at the ends rather than inventing days', () => {
    // Window 3, centred. First day averages only itself and its neighbour.
    expect(smoothHeights(held([0, 3, 3, 3, 0]), 3)).toEqual([1.5, 2, 3, 2, 1.5])
  })

  it('keeps a real stretch away from the ground low', () => {
    const smoothed = smoothHeights(held([5, 5, 0, 0, 0, 0, 0, 5, 5]), 3)
    // The middle of the gap stays at the floor; one bad day would not.
    expect(smoothed[4]).toBe(0)
  })

  it('never rises above the height of a whole day', () => {
    const smoothed = smoothHeights(held(Array(30).fill(5)), 7)
    expect(Math.max(...smoothed)).toBe(5)
  })
})

describe('buildRidgePath', () => {
  it('is empty when there is no journey yet', () => {
    expect(buildRidgePath([])).toBe('')
  })

  it('rises higher for a day that held more ground', () => {
    // Floor is 5, so a full day sits at y=0 and an empty day at y=5.
    const path = buildRidgePath([day('2026-08-14', 5), day('2026-08-15', 0)])
    expect(path).toContain('M 0,0')
    expect(path).toContain('L 1,5')
  })

  it('closes down to the earth and back, so the shape is filled mass', () => {
    const path = buildRidgePath([day('2026-08-15', 3)])
    expect(path.endsWith('L 1,5 L 0,5 Z')).toBe(true)
  })

  it('carries the last day out to the full width', () => {
    const days = [day('2026-08-13', 1), day('2026-08-14', 4), day('2026-08-15', 2)]
    // Ridge points at x=0,1,2, then held out to x=3 before dropping.
    expect(buildRidgePath(days)).toContain('L 3,3 L 3,5')
  })

  it('gives every day its own point on the ridge', () => {
    const days = Array.from({ length: 40 }, (_, i) => day(`2026-08-${i}`, i % 6))
    const path = buildRidgePath(days)
    expect(path.match(/L /g)?.length).toBe(40 + 2) // 39 ridge + closing width, floor, origin
  })

  it('reads a long journey at a coarser grain, so it is terrain and not static', () => {
    // Alternating full and empty days: raw, this is a picket fence.
    const days = Array.from({ length: 400 }, (_, i) => day(`d${i}`, i % 2 ? 5 : 0))
    const path = buildRidgePath(days)
    // Smoothed, the daily flicker settles toward the middle of the range.
    expect(path).not.toContain(',0 L')
    expect(path).toMatch(/2\.\d/)
  })
})

describe('Journey', () => {
  it('shows nothing but ground before there is any journey', () => {
    const { container } = render(<Journey days={[]} />)
    expect(container.querySelector('svg')).not.toBeInTheDocument()
  })

  it('stretches one unit per day, so any span fits without aggregating', () => {
    const days = Array.from({ length: 365 }, (_, i) => day(`d${i}`, 3))
    const { container } = render(<Journey days={days} />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('viewBox', '0 0 365 5')
    expect(svg).toHaveAttribute('preserveAspectRatio', 'none')
  })

  it('is terrain, not a chart — no axis, ticks, or readable figures', () => {
    const days = [day('2026-08-14', 5), day('2026-08-15', 2)]
    const { container } = render(<Journey days={days} />)
    expect(container.querySelector('text')).not.toBeInTheDocument()
    expect(container.querySelector('line')).not.toBeInTheDocument()
    expect(container.textContent).toBe('')
  })

  it('is filled solid rather than drawn as a floating line', () => {
    const { container } = render(<Journey days={[day('2026-08-15', 4)]} />)
    const path = container.querySelector('path')
    expect(path).toHaveAttribute('fill', 'var(--color-green-700)')
    expect(path).not.toHaveAttribute('stroke')
  })

  it('names the span for a screen reader without scoring it', () => {
    render(<Journey days={[day('2026-08-14', 5), day('2026-08-15', 0)]} />)
    expect(screen.getByRole('img')).toHaveAttribute('aria-label', 'The journey, 2 days')
  })
})
