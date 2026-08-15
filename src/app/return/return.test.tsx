import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import ReturnPage from './page'
import { isReturnOpen } from '@/lib/return-window'
import { useJourney } from '@/hooks/use-journey'

const mockGetUser = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({ auth: { getUser: mockGetUser } }),
}))

vi.mock('@/lib/return-window', () => ({ isReturnOpen: vi.fn() }))

vi.mock('@/hooks/use-journey', () => ({
  useJourney: vi.fn(),
  ANCHOR_COUNT: 5,
}))

vi.mock('@/components/journey', () => ({
  Journey: ({ days }: { days: unknown[] }) => (
    <div data-testid="journey">{days.length}</div>
  ),
}))

describe('ReturnPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } } })
    vi.mocked(useJourney).mockReturnValue({
      days: [
        { date: '2026-08-01', held: 4 },
        { date: '2026-08-15', held: 2 },
      ],
      isLoading: false,
      error: null,
    })
  })

  it('shows the journey when the window is open', async () => {
    vi.mocked(isReturnOpen).mockReturnValue(true)
    render(<ReturnPage />)

    await waitFor(() => {
      expect(screen.getByTestId('journey')).toBeInTheDocument()
    })
    expect(screen.getByText('return')).toBeInTheDocument()
  })

  it('marks the ends of the span, and nothing in between', async () => {
    vi.mocked(isReturnOpen).mockReturnValue(true)
    render(<ReturnPage />)

    await waitFor(() => {
      expect(screen.getByText('Aug 1')).toBeInTheDocument()
    })
    expect(screen.getByText('Aug 15')).toBeInTheDocument()
  })

  it('shows only ground when the window is shut', async () => {
    vi.mocked(isReturnOpen).mockReturnValue(false)
    const { container } = render(<ReturnPage />)

    await waitFor(() => {
      expect(container.querySelector('.ground-arrive')).toBeInTheDocument()
    })
    expect(screen.queryByTestId('journey')).not.toBeInTheDocument()
  })

  it('never counts down to the next window, or mentions one', async () => {
    vi.mocked(isReturnOpen).mockReturnValue(false)
    const { container } = render(<ReturnPage />)

    await waitFor(() => {
      expect(container.querySelector('.ground-arrive')).toBeInTheDocument()
    })
    // Nothing is said about the wait. Not a word.
    expect(container.textContent).toBe('')
  })

  it('does not read the journey at all while the window is shut', async () => {
    vi.mocked(isReturnOpen).mockReturnValue(false)
    render(<ReturnPage />)

    await waitFor(() => {
      expect(mockGetUser).toHaveBeenCalled()
    })
    expect(useJourney).not.toHaveBeenCalled()
  })
})
