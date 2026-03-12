import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

// Mock Supabase client
const mockGetUser = vi.fn().mockResolvedValue({
  data: { user: { id: 'user-123', email: 'test@example.com' } },
})

const mockLte = vi.fn().mockResolvedValue({ data: [], error: null })

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: { getUser: mockGetUser },
    from: () => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          gte: vi.fn().mockReturnValue({
            lte: mockLte,
          }),
        }),
      }),
    }),
  }),
}))

// Mock dates
vi.mock('@/lib/dates', () => ({
  getEffectiveDate: () => '2026-03-12',
  formatDateString: (d: Date) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  },
}))

import GroundPage from './page'

describe('GroundPage', () => {
  it('renders heading after auth', async () => {
    render(<GroundPage />)

    await waitFor(() => {
      expect(screen.getByText('7 days')).toBeInTheDocument()
    })
  })

  it('renders integrity grid with anchor labels', async () => {
    render(<GroundPage />)

    await waitFor(() => {
      expect(screen.getByText('sleep')).toBeInTheDocument()
    })

    expect(screen.getByText('food')).toBeInTheDocument()
    expect(screen.getByText('medication')).toBeInTheDocument()
    expect(screen.getByText('body')).toBeInTheDocument()
    expect(screen.getByText('ground')).toBeInTheDocument()
  })

  it('renders empty div while loading user', () => {
    mockGetUser.mockReturnValueOnce(new Promise(() => {})) // Never resolves
    const { container } = render(<GroundPage />)
    expect(container.querySelector('.p-4')).toBeInTheDocument()
  })
})
