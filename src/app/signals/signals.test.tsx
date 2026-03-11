import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

// Mock Supabase client
const mockMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null })
const mockSingle = vi.fn().mockResolvedValue({ data: {}, error: null })
const mockSelectAfterUpsert = vi.fn().mockReturnValue({ single: mockSingle })
const mockUpsert = vi.fn().mockReturnValue({ select: mockSelectAfterUpsert })
const mockLimit = vi.fn().mockResolvedValue({ data: [], error: null })
const mockOrder = vi.fn().mockReturnValue({ limit: mockLimit })

function createFromMock() {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    maybeSingle: mockMaybeSingle,
    upsert: mockUpsert,
    order: mockOrder,
    limit: mockLimit,
  }
  chain.select.mockReturnValue(chain)
  chain.eq.mockReturnValue(chain)
  chain.neq.mockReturnValue(chain)
  return vi.fn().mockReturnValue(chain)
}

const mockFrom = createFromMock()

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: mockFrom,
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'user-123' } },
      }),
    },
  }),
}))

vi.mock('@/lib/dates', () => ({
  getWeekStart: () => '2026-03-09',
  formatWeekRange: (_ws: string) => {
    if (_ws === '2026-03-09') return 'Mar 9 \u2013 15'
    if (_ws === '2026-03-02') return 'Mar 2 \u2013 8'
    if (_ws === '2026-02-23') return 'Feb 23 \u2013 Mar 1'
    return `Week of ${_ws}`
  },
}))

import SignalsPage from './page'

describe('SignalsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Re-setup the chain after clearing mocks
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      maybeSingle: mockMaybeSingle,
      upsert: mockUpsert,
      order: mockOrder,
      limit: mockLimit,
    }
    chain.select.mockReturnValue(chain)
    chain.eq.mockReturnValue(chain)
    chain.neq.mockReturnValue(chain)
    mockFrom.mockReturnValue(chain)
    mockMaybeSingle.mockResolvedValue({ data: null, error: null })
    mockSingle.mockResolvedValue({ data: {}, error: null })
    mockSelectAfterUpsert.mockReturnValue({ single: mockSingle })
    mockUpsert.mockReturnValue({ select: mockSelectAfterUpsert })
    mockLimit.mockResolvedValue({ data: [], error: null })
    mockOrder.mockReturnValue({ limit: mockLimit })
  })

  it('renders loading state initially', () => {
    render(<SignalsPage />)
    // Auth wrapper shows empty div while user loads
    const container = document.querySelector('.p-4')
    expect(container).toBeInTheDocument()
  })

  it('displays week header after loading', async () => {
    render(<SignalsPage />)

    await waitFor(() => {
      expect(screen.getByText('Mar 9 \u2013 15')).toBeInTheDocument()
    })
  })

  it('renders three form fields with section labels', async () => {
    render(<SignalsPage />)

    await waitFor(() => {
      expect(screen.getByText('financial')).toBeInTheDocument()
    })

    expect(screen.getByText('sleep')).toBeInTheDocument()
    expect(screen.getByText('note')).toBeInTheDocument()

    const textareas = screen.getAllByRole('textbox')
    expect(textareas).toHaveLength(3)
  })

  it('renders save button', async () => {
    render(<SignalsPage />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'save' })).toBeInTheDocument()
    })
  })

  it('typing in fields updates the textarea value', async () => {
    render(<SignalsPage />)

    await waitFor(() => {
      expect(screen.getAllByRole('textbox')).toHaveLength(3)
    })

    const textareas = screen.getAllByRole('textbox')
    fireEvent.change(textareas[0], { target: { value: 'budget is fine' } })

    expect(textareas[0]).toHaveValue('budget is fine')
  })

  it('save button triggers upsert', async () => {
    mockSingle.mockResolvedValue({ data: {}, error: null })

    render(<SignalsPage />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'save' })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'save' }))

    await waitFor(() => {
      expect(mockUpsert).toHaveBeenCalled()
    })
  })

  it('displays recent signals when history exists', async () => {
    const recentData = [
      {
        id: 's1',
        user_id: 'user-123',
        week_start: '2026-03-02',
        financial_note: 'spent wisely',
        sleep_state: '',
        note: 'great week',
        created_at: '2026-03-02T00:00:00.000Z',
        updated_at: '2026-03-02T00:00:00.000Z',
      },
      {
        id: 's2',
        user_id: 'user-123',
        week_start: '2026-02-23',
        financial_note: '',
        sleep_state: 'tired',
        note: '',
        created_at: '2026-02-23T00:00:00.000Z',
        updated_at: '2026-02-23T00:00:00.000Z',
      },
    ]
    mockLimit.mockResolvedValueOnce({ data: recentData, error: null })

    render(<SignalsPage />)

    await waitFor(() => {
      expect(screen.getByText('recent weeks')).toBeInTheDocument()
    })

    expect(screen.getByText('spent wisely')).toBeInTheDocument()
    expect(screen.getByText('great week')).toBeInTheDocument()
    expect(screen.getByText('tired')).toBeInTheDocument()
  })

  it('shows empty state when no recent signals', async () => {
    mockLimit.mockResolvedValueOnce({ data: [], error: null })

    render(<SignalsPage />)

    await waitFor(() => {
      expect(screen.getByText('Mar 9 \u2013 15')).toBeInTheDocument()
    })

    expect(screen.queryByText('recent weeks')).not.toBeInTheDocument()
  })

  it('displays error message with alert role', async () => {
    mockMaybeSingle.mockResolvedValueOnce({
      data: null,
      error: { message: 'Something went wrong' },
    })

    render(<SignalsPage />)

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })
})
