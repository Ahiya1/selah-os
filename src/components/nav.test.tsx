import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}))

// Mock next/link to render a simple <a> tag
vi.mock('next/link', () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}))

import { Nav } from './nav'

describe('Nav', () => {
  it('renders four navigation links', () => {
    render(<Nav />)
    expect(screen.getByText('Today')).toBeInTheDocument()
    expect(screen.getByText('Project')).toBeInTheDocument()
    expect(screen.getByText('Signals')).toBeInTheDocument()
    expect(screen.getByText('Ground')).toBeInTheDocument()
  })

  it('has correct href attributes', () => {
    render(<Nav />)
    expect(screen.getByText('Today').closest('a')).toHaveAttribute('href', '/')
    expect(screen.getByText('Project').closest('a')).toHaveAttribute('href', '/project')
    expect(screen.getByText('Signals').closest('a')).toHaveAttribute('href', '/signals')
    expect(screen.getByText('Ground').closest('a')).toHaveAttribute('href', '/ground')
  })

  it('has main navigation aria-label', () => {
    render(<Nav />)
    expect(screen.getByRole('navigation')).toHaveAttribute('aria-label', 'Main navigation')
  })

  it('highlights the active nav item', () => {
    render(<Nav />)
    const todayLink = screen.getByText('Today').closest('a')
    const projectLink = screen.getByText('Project').closest('a')
    // Today is active (pathname is '/'), should have green-600 class
    expect(todayLink?.className).toContain('text-green-600')
    // Project is inactive, should have warm-600 class
    expect(projectLink?.className).toContain('text-warm-600')
  })
})
