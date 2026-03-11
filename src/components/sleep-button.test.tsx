import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SleepButton } from './sleep-button'

// Mock the dates module to avoid locale-dependent issues in tests
vi.mock('@/lib/dates', () => ({
  formatTime: (iso: string) => {
    const date = new Date(iso)
    const hours = String(date.getUTCHours()).padStart(2, '0')
    const minutes = String(date.getUTCMinutes()).padStart(2, '0')
    return `${hours}:${minutes}`
  },
}))

describe('SleepButton', () => {
  it('renders label when no timestamp', () => {
    render(
      <SleepButton label="going to sleep" timestamp={null} onToggle={() => {}} />
    )
    expect(screen.getByText('going to sleep')).toBeInTheDocument()
  })

  it('renders label with time when timestamp is set', () => {
    render(
      <SleepButton
        label="woke up"
        timestamp="2026-03-12T07:14:00.000Z"
        onToggle={() => {}}
      />
    )
    expect(screen.getByText('woke up 07:14')).toBeInTheDocument()
  })

  it('calls onToggle when clicked', () => {
    const onToggle = vi.fn()
    render(
      <SleepButton label="going to sleep" timestamp={null} onToggle={onToggle} />
    )
    fireEvent.click(screen.getByRole('button'))
    expect(onToggle).toHaveBeenCalledTimes(1)
  })

  it('has proper button semantics', () => {
    render(
      <SleepButton label="going to sleep" timestamp={null} onToggle={() => {}} />
    )
    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('type', 'button')
  })

  it('has minimum height for tap target', () => {
    render(
      <SleepButton label="going to sleep" timestamp={null} onToggle={() => {}} />
    )
    const button = screen.getByRole('button')
    expect(button).toHaveClass('min-h-[56px]')
  })

  it('shows muted style when timestamp is recorded', () => {
    render(
      <SleepButton
        label="woke up"
        timestamp="2026-03-12T07:14:00.000Z"
        onToggle={() => {}}
      />
    )
    const button = screen.getByRole('button')
    expect(button).toHaveClass('bg-warm-200')
    expect(button).toHaveClass('text-warm-500')
  })

  it('shows active style when no timestamp', () => {
    render(
      <SleepButton label="going to sleep" timestamp={null} onToggle={() => {}} />
    )
    const button = screen.getByRole('button')
    expect(button).toHaveClass('bg-warm-50')
    expect(button).toHaveClass('text-warm-800')
  })

  it('is full width', () => {
    render(
      <SleepButton label="going to sleep" timestamp={null} onToggle={() => {}} />
    )
    const button = screen.getByRole('button')
    expect(button).toHaveClass('w-full')
  })
})
