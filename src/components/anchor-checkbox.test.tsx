import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AnchorCheckbox } from './anchor-checkbox'

describe('AnchorCheckbox', () => {
  it('renders with label', () => {
    render(
      <AnchorCheckbox id="test" label="breakfast" value={null} onChange={() => {}} />
    )
    expect(screen.getByText('breakfast')).toBeInTheDocument()
  })

  it('shows untouched state when value is null', () => {
    const { container } = render(
      <AnchorCheckbox id="test" label="breakfast" value={null} onChange={() => {}} />
    )
    const button = screen.getByRole('checkbox')
    expect(button).toHaveClass('border-warm-400')
    expect(button).not.toHaveClass('bg-green-600')
    expect(button).not.toHaveClass('bg-warm-300')
    expect(container.querySelector('svg')).not.toBeInTheDocument()
  })

  it('gives under the finger', () => {
    render(
      <AnchorCheckbox id="test" label="breakfast" value={null} onChange={() => {}} />
    )
    expect(screen.getByRole('checkbox')).toHaveClass('anchor-circle')
  })

  it('shows done state when value is true', () => {
    const { container } = render(
      <AnchorCheckbox id="test" label="breakfast" value={true} onChange={() => {}} />
    )
    const button = screen.getByRole('checkbox')
    expect(button).toHaveClass('bg-green-600')
    expect(button).toHaveClass('border-green-600')
    // Checkmark SVG present
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
    expect(svg).toHaveClass('text-warm-50')
  })

  it('renders a legacy false value as blank, with no mark of its own', () => {
    const { container } = render(
      <AnchorCheckbox id="test" label="breakfast" value={false} onChange={() => {}} />
    )
    const button = screen.getByRole('checkbox')
    expect(button).toHaveClass('border-warm-400')
    expect(button).not.toHaveClass('bg-warm-300')
    expect(button).not.toHaveClass('bg-green-600')
    expect(container.querySelector('svg')).not.toBeInTheDocument()
  })

  it('marks done on click when untouched', () => {
    const onChange = vi.fn()
    render(
      <AnchorCheckbox id="test" label="breakfast" value={null} onChange={onChange} />
    )
    fireEvent.click(screen.getByRole('checkbox'))
    expect(onChange).toHaveBeenCalledWith(true)
  })

  it('returns to blank on click when done — never to a not-done mark', () => {
    const onChange = vi.fn()
    render(
      <AnchorCheckbox id="test" label="breakfast" value={true} onChange={onChange} />
    )
    fireEvent.click(screen.getByRole('checkbox'))
    expect(onChange).toHaveBeenCalledWith(null)
  })

  it('marks a legacy false value done on click, retiring the old state', () => {
    const onChange = vi.fn()
    render(
      <AnchorCheckbox id="test" label="breakfast" value={false} onChange={onChange} />
    )
    fireEvent.click(screen.getByRole('checkbox'))
    expect(onChange).toHaveBeenCalledWith(true)
  })

  it('has minimum tap target size', () => {
    const { container } = render(
      <AnchorCheckbox id="test" label="breakfast" value={null} onChange={() => {}} />
    )
    const wrapper = container.firstElementChild
    expect(wrapper).toHaveClass('min-w-[56px]')
    expect(wrapper).toHaveClass('min-h-[56px]')
  })

  it('has proper ARIA attributes for null state', () => {
    render(
      <AnchorCheckbox id="test" label="breakfast" value={null} onChange={() => {}} />
    )
    const button = screen.getByRole('checkbox')
    expect(button).toHaveAttribute('aria-checked', 'false')
    expect(button).toHaveAttribute('aria-label', 'breakfast: untouched')
  })

  it('has proper ARIA attributes for true state', () => {
    render(
      <AnchorCheckbox id="test" label="breakfast" value={true} onChange={() => {}} />
    )
    const button = screen.getByRole('checkbox')
    expect(button).toHaveAttribute('aria-checked', 'true')
    expect(button).toHaveAttribute('aria-label', 'breakfast: done')
  })

  it('announces a legacy false value as untouched', () => {
    render(
      <AnchorCheckbox id="test" label="breakfast" value={false} onChange={() => {}} />
    )
    const button = screen.getByRole('checkbox')
    expect(button).toHaveAttribute('aria-checked', 'false')
    expect(button).toHaveAttribute('aria-label', 'breakfast: untouched')
  })

  it('updates ARIA when value changes', () => {
    const { rerender } = render(
      <AnchorCheckbox id="test" label="breakfast" value={true} onChange={() => {}} />
    )
    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-label', 'breakfast: done')

    rerender(
      <AnchorCheckbox id="test" label="breakfast" value={null} onChange={() => {}} />
    )
    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-checked', 'false')
    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-label', 'breakfast: untouched')
  })

  it('has proper id attribute on button', () => {
    render(
      <AnchorCheckbox id="test-meal" label="breakfast" value={null} onChange={() => {}} />
    )
    const button = screen.getByRole('checkbox')
    expect(button).toHaveAttribute('id', 'test-meal')
  })

  it('button has type="button"', () => {
    render(
      <AnchorCheckbox id="test" label="breakfast" value={null} onChange={() => {}} />
    )
    const button = screen.getByRole('checkbox')
    expect(button).toHaveAttribute('type', 'button')
  })

  it('reveals the timestamp briefly when marked done', () => {
    const { container, rerender } = render(
      <AnchorCheckbox id="test" label="breakfast" value={null} timestamp={null} onChange={() => {}} />
    )
    // Not shown at rest
    expect(container.querySelector('.anchor-time')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('checkbox'))
    // Parent reflects the new done state + stamped time (as useDailyRecord does)
    rerender(
      <AnchorCheckbox
        id="test"
        label="breakfast"
        value={true}
        timestamp="2026-05-27T08:10:00.000Z"
        onChange={() => {}}
      />
    )
    const time = container.querySelector('.anchor-time')
    expect(time).toBeInTheDocument()
    expect(time).toHaveTextContent(/\d{2}:\d{2}/)
  })

  it('plays the beat and tree-ring on completion only', () => {
    const { container } = render(
      <AnchorCheckbox id="test" label="breakfast" value={null} onChange={() => {}} />
    )
    expect(container.querySelector('.anchor-tree-ring')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('checkbox'))
    expect(screen.getByRole('checkbox')).toHaveClass('anchor-beat')
    expect(container.querySelector('.anchor-tree-ring')).toBeInTheDocument()
  })

  it('does not reveal time or ring when leaving the done state', () => {
    const { container } = render(
      <AnchorCheckbox
        id="test"
        label="breakfast"
        value={true}
        timestamp="2026-05-27T08:10:00.000Z"
        onChange={() => {}}
      />
    )
    // true -> false on click; no reveal, no ring
    fireEvent.click(screen.getByRole('checkbox'))
    expect(container.querySelector('.anchor-tree-ring')).not.toBeInTheDocument()
    expect(container.querySelector('.anchor-time')).not.toBeInTheDocument()
  })

  it('never uses red or error colors in any state', () => {
    for (const value of [null, false, true] as const) {
      const { container, unmount } = render(
        <AnchorCheckbox id="test" label="breakfast" value={value} onChange={() => {}} />
      )
      const button = screen.getByRole('checkbox')
      expect(button.className).not.toContain('red')
      expect(button.className).not.toContain('error')

      const svg = container.querySelector('svg')
      if (svg) {
        const cls = svg.className.baseVal || svg.getAttribute('class') || ''
        expect(cls).not.toContain('red')
        expect(cls).not.toContain('error')
      }
      unmount()
    }
  })

  it('leaves no visible mark for an unmet anchor', () => {
    const { container } = render(
      <AnchorCheckbox id="test" label="breakfast" value={null} onChange={() => {}} />
    )
    // Blank is blank: an empty ring, nothing drawn inside it.
    expect(container.querySelector('svg')).not.toBeInTheDocument()
  })
})
