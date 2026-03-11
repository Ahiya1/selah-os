import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'

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
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-123' } } }),
    },
  }),
}))

vi.mock('@/lib/dates', () => ({
  getWeekStart: () => '2026-03-09',
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  formatWeekRange: (_ws: string) => `Mar 9 \u2013 15`,
}))

import { useWeeklySignals } from './use-weekly-signals'

type WeeklySignal = {
  id: string
  user_id: string
  week_start: string
  financial_note: string
  sleep_state: string
  note: string
  created_at: string
  updated_at: string
}

function createMockWeeklySignal(overrides: Partial<WeeklySignal> = {}): WeeklySignal {
  return {
    id: 'signal-123',
    user_id: 'user-123',
    week_start: '2026-03-09',
    financial_note: '',
    sleep_state: '',
    note: '',
    created_at: '2026-03-09T00:00:00.000Z',
    updated_at: '2026-03-09T00:00:00.000Z',
    ...overrides,
  }
}

describe('useWeeklySignals', () => {
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

  afterEach(() => {
    vi.useRealTimers()
  })

  it('initializes with isLoading true', () => {
    const { result } = renderHook(() => useWeeklySignals('user-123'))
    expect(result.current.isLoading).toBe(true)
  })

  it('fetches current week signal on mount', async () => {
    const mockSignal = createMockWeeklySignal({
      financial_note: 'budget ok',
      sleep_state: 'good',
      note: 'productive week',
    })
    mockMaybeSingle.mockResolvedValueOnce({ data: mockSignal, error: null })

    const { result } = renderHook(() => useWeeklySignals('user-123'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.currentSignal.financial_note).toBe('budget ok')
    expect(result.current.currentSignal.sleep_state).toBe('good')
    expect(result.current.currentSignal.note).toBe('productive week')
  })

  it('starts with empty signal when no current week data exists', async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null })

    const { result } = renderHook(() => useWeeklySignals('user-123'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.currentSignal.financial_note).toBe('')
    expect(result.current.currentSignal.sleep_state).toBe('')
    expect(result.current.currentSignal.note).toBe('')
  })

  it('fetches recent signals (excluding current week)', async () => {
    const recentData = [
      createMockWeeklySignal({ id: 's1', week_start: '2026-03-02', financial_note: 'week 1' }),
      createMockWeeklySignal({ id: 's2', week_start: '2026-02-23', financial_note: 'week 2' }),
    ]
    mockLimit.mockResolvedValueOnce({ data: recentData, error: null })

    const { result } = renderHook(() => useWeeklySignals('user-123'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.recentSignals).toHaveLength(2)
    expect(result.current.recentSignals[0].financial_note).toBe('week 1')
    expect(result.current.recentSignals[1].financial_note).toBe('week 2')
  })

  it('sets error on current week fetch failure', async () => {
    mockMaybeSingle.mockResolvedValueOnce({
      data: null,
      error: { message: 'Network error' },
    })

    const { result } = renderHook(() => useWeeklySignals('user-123'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBe('Network error')
  })

  it('sets error on recent signals fetch failure', async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null })
    mockLimit.mockResolvedValueOnce({
      data: null,
      error: { message: 'Recent fetch failed' },
    })

    const { result } = renderHook(() => useWeeklySignals('user-123'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBe('Recent fetch failed')
  })

  it('updateField updates local state only', async () => {
    const { result } = renderHook(() => useWeeklySignals('user-123'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    act(() => {
      result.current.updateField('financial_note', 'new budget info')
    })

    expect(result.current.currentSignal.financial_note).toBe('new budget info')
    // Upsert should NOT have been called (local state only)
    expect(mockUpsert).not.toHaveBeenCalled()
  })

  it('save calls upsert with current signal data', async () => {
    const savedSignal = createMockWeeklySignal({
      financial_note: 'saved data',
      sleep_state: 'rested',
      note: 'good week',
    })
    mockSingle.mockResolvedValueOnce({ data: savedSignal, error: null })

    const { result } = renderHook(() => useWeeklySignals('user-123'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    act(() => {
      result.current.updateField('financial_note', 'saved data')
      result.current.updateField('sleep_state', 'rested')
      result.current.updateField('note', 'good week')
    })

    await act(async () => {
      await result.current.save()
    })

    expect(mockUpsert).toHaveBeenCalledWith(
      {
        user_id: 'user-123',
        week_start: '2026-03-09',
        financial_note: 'saved data',
        sleep_state: 'rested',
        note: 'good week',
      },
      { onConflict: 'user_id,week_start' }
    )
  })

  it('save sets isSaving during save operation', async () => {
    let resolveUpsert: (value: unknown) => void
    const upsertPromise = new Promise((resolve) => {
      resolveUpsert = resolve
    })
    mockSingle.mockReturnValueOnce(upsertPromise)

    const { result } = renderHook(() => useWeeklySignals('user-123'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.isSaving).toBe(false)

    // Start saving (don't await)
    let savePromise: Promise<void>
    act(() => {
      savePromise = result.current.save()
    })

    // isSaving should be true while awaiting
    expect(result.current.isSaving).toBe(true)

    // Resolve the upsert
    await act(async () => {
      resolveUpsert!({ data: createMockWeeklySignal(), error: null })
      await savePromise!
    })

    expect(result.current.isSaving).toBe(false)
  })

  it('save handles error gracefully', async () => {
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { message: 'Save failed' },
    })

    const { result } = renderHook(() => useWeeklySignals('user-123'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.save()
    })

    expect(result.current.error).toBe('Save failed')
    expect(result.current.isSaving).toBe(false)
  })

  it('save with empty fields sends empty strings', async () => {
    mockSingle.mockResolvedValueOnce({ data: createMockWeeklySignal(), error: null })

    const { result } = renderHook(() => useWeeklySignals('user-123'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.save()
    })

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        financial_note: '',
        sleep_state: '',
        note: '',
      }),
      { onConflict: 'user_id,week_start' }
    )
  })

  it('exposes weekStart from getWeekStart', () => {
    const { result } = renderHook(() => useWeeklySignals('user-123'))
    expect(result.current.weekStart).toBe('2026-03-09')
  })

  it('initializes with no error', () => {
    const { result } = renderHook(() => useWeeklySignals('user-123'))
    expect(result.current.error).toBeNull()
  })
})
