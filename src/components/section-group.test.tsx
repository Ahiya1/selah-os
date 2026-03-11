import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SectionGroup } from './section-group'

describe('SectionGroup', () => {
  it('renders the label as uppercase heading', () => {
    render(<SectionGroup label="sleep"><div>content</div></SectionGroup>)
    expect(screen.getByText('sleep')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('sleep')
  })

  it('renders children', () => {
    render(<SectionGroup label="test"><p>child content</p></SectionGroup>)
    expect(screen.getByText('child content')).toBeInTheDocument()
  })

  it('has uppercase tracking-wide styling on label', () => {
    render(<SectionGroup label="food"><div /></SectionGroup>)
    const heading = screen.getByRole('heading', { level: 2 })
    expect(heading).toHaveClass('uppercase')
    expect(heading).toHaveClass('tracking-wide')
  })

  it('uses section element for semantic grouping', () => {
    const { container } = render(<SectionGroup label="test"><div /></SectionGroup>)
    expect(container.querySelector('section')).toBeInTheDocument()
  })

  it('uses text-warm-600 for WCAG AA contrast compliance', () => {
    render(<SectionGroup label="ground"><div /></SectionGroup>)
    const heading = screen.getByRole('heading', { level: 2 })
    expect(heading).toHaveClass('text-warm-600')
  })
})
