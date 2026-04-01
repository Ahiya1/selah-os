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

  it('shows not-done state when value is false', () => {
    const { container } = render(
      <AnchorCheckbox id="test" label="breakfast" value={false} onChange={() => {}} />
    )
    const button = screen.getByRole('checkbox')
    expect(button).toHaveClass('bg-warm-300')
    expect(button).toHaveClass('border-warm-400')
    // Dash SVG present
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
    expect(svg).toHaveClass('text-warm-600')
  })

  it('cycles null -> true on click', () => {
    const onChange = vi.fn()
    render(
      <AnchorCheckbox id="test" label="breakfast" value={null} onChange={onChange} />
    )
    fireEvent.click(screen.getByRole('checkbox'))
    expect(onChange).toHaveBeenCalledWith(true)
  })

  it('cycles true -> false on click', () => {
    const onChange = vi.fn()
    render(
      <AnchorCheckbox id="test" label="breakfast" value={true} onChange={onChange} />
    )
    fireEvent.click(screen.getByRole('checkbox'))
    expect(onChange).toHaveBeenCalledWith(false)
  })

  it('cycles false -> null on click', () => {
    const onChange = vi.fn()
    render(
      <AnchorCheckbox id="test" label="breakfast" value={false} onChange={onChange} />
    )
    fireEvent.click(screen.getByRole('checkbox'))
    expect(onChange).toHaveBeenCalledWith(null)
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
    expect(button).toHaveAttribute('aria-checked', 'mixed')
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

  it('has proper ARIA attributes for false state', () => {
    render(
      <AnchorCheckbox id="test" label="breakfast" value={false} onChange={() => {}} />
    )
    const button = screen.getByRole('checkbox')
    expect(button).toHaveAttribute('aria-checked', 'false')
    expect(button).toHaveAttribute('aria-label', 'breakfast: not done')
  })

  it('updates ARIA when value changes', () => {
    const { rerender } = render(
      <AnchorCheckbox id="test" label="breakfast" value={true} onChange={() => {}} />
    )
    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-label', 'breakfast: done')

    rerender(
      <AnchorCheckbox id="test" label="breakfast" value={false} onChange={() => {}} />
    )
    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-checked', 'false')
    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-label', 'breakfast: not done')

    rerender(
      <AnchorCheckbox id="test" label="breakfast" value={null} onChange={() => {}} />
    )
    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-checked', 'mixed')
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

  it('does not use red or error colors for not-done state', () => {
    const { container } = render(
      <AnchorCheckbox id="test" label="breakfast" value={false} onChange={() => {}} />
    )
    const button = screen.getByRole('checkbox')
    expect(button.className).not.toContain('red')
    expect(button.className).not.toContain('error')
    const svg = container.querySelector('svg')
    expect(svg!.className.baseVal || svg!.getAttribute('class')).not.toContain('red')
    expect(svg!.className.baseVal || svg!.getAttribute('class')).not.toContain('error')
  })
})
