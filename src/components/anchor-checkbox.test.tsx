import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AnchorCheckbox } from './anchor-checkbox'

describe('AnchorCheckbox', () => {
  it('renders with label', () => {
    render(
      <AnchorCheckbox id="test" label="breakfast" checked={false} onChange={() => {}} />
    )
    expect(screen.getByText('breakfast')).toBeInTheDocument()
  })

  it('calls onChange when clicked', () => {
    const onChange = vi.fn()
    render(
      <AnchorCheckbox id="test" label="breakfast" checked={false} onChange={onChange} />
    )
    fireEvent.click(screen.getByLabelText('breakfast'))
    expect(onChange).toHaveBeenCalledWith(true)
  })

  it('shows checked state', () => {
    render(
      <AnchorCheckbox id="test" label="breakfast" checked={true} onChange={() => {}} />
    )
    expect(screen.getByRole('checkbox')).toBeChecked()
  })

  it('shows unchecked state', () => {
    render(
      <AnchorCheckbox id="test" label="breakfast" checked={false} onChange={() => {}} />
    )
    expect(screen.getByRole('checkbox')).not.toBeChecked()
  })

  it('has a minimum tap target size', () => {
    const { container } = render(
      <AnchorCheckbox id="test" label="breakfast" checked={false} onChange={() => {}} />
    )
    const label = container.querySelector('label')
    expect(label).toHaveClass('min-w-[56px]')
    expect(label).toHaveClass('min-h-[56px]')
  })

  it('renders check icon when checked', () => {
    const { container } = render(
      <AnchorCheckbox id="test" label="breakfast" checked={true} onChange={() => {}} />
    )
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })

  it('does not render check icon when unchecked', () => {
    const { container } = render(
      <AnchorCheckbox id="test" label="breakfast" checked={false} onChange={() => {}} />
    )
    const svg = container.querySelector('svg')
    expect(svg).not.toBeInTheDocument()
  })

  it('calls onChange with false when unchecking', () => {
    const onChange = vi.fn()
    render(
      <AnchorCheckbox id="test" label="breakfast" checked={true} onChange={onChange} />
    )
    fireEvent.click(screen.getByLabelText('breakfast'))
    expect(onChange).toHaveBeenCalledWith(false)
  })

  it('has proper label-input association via htmlFor and id', () => {
    render(
      <AnchorCheckbox id="test-meal" label="breakfast" checked={false} onChange={() => {}} />
    )
    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toHaveAttribute('id', 'test-meal')
  })
})
