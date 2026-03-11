import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'

// Mock Supabase client
const mockMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null })
const mockSingle = vi.fn().mockResolvedValue({ data: {}, error: null })
const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
const mockUpsert = vi.fn().mockReturnValue({ select: mockSelect })

// Build chained mock for .from('daily_records').select('*').eq(...).eq(...).maybeSingle()
function createFromMock() {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: mockMaybeSingle,
    upsert: mockUpsert,
  }
  // Make eq chainable
  chain.select.mockReturnValue(chain)
  chain.eq.mockReturnValue(chain)

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
  getEffectiveDate: () => '2026-03-12',
}))

import { useDailyRecord } from './use-daily-record'

describe('useDailyRecord', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Re-setup the chain after clearing mocks
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: mockMaybeSingle,
      upsert: mockUpsert,
    }
    chain.select.mockReturnValue(chain)
    chain.eq.mockReturnValue(chain)
    mockFrom.mockReturnValue(chain)
    mockMaybeSingle.mockResolvedValue({ data: null, error: null })
    mockSingle.mockResolvedValue({ data: {}, error: null })
    mockSelect.mockReturnValue({ single: mockSingle })
    mockUpsert.mockReturnValue({ select: mockSelect })
  })

  afterEach(() => {
    vi.useRealTimers()
    // Restore visibilityState in case a test changed it
    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      writable: true,
      configurable: true,
    })
  })

  it('fetches record on mount', async () => {
    const { result } = renderHook(() => useDailyRecord('user-123'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })
  })

  it('updates field optimistically', () => {
    const { result } = renderHook(() => useDailyRecord('user-123'))

    act(() => {
      result.current.updateField('breakfast', true)
    })

    expect(result.current.record.breakfast).toBe(true)
  })

  it('starts with empty record for effective date', () => {
    const { result } = renderHook(() => useDailyRecord('user-123'))

    expect(result.current.record.date).toBe('2026-03-12')
    expect(result.current.record.breakfast).toBe(false)
    expect(result.current.record.lunch).toBe(false)
    expect(result.current.record.dinner).toBe(false)
    expect(result.current.record.cipralex_taken).toBe(false)
    expect(result.current.record.note).toBe('')
  })

  it('provides the effective date', () => {
    const { result } = renderHook(() => useDailyRecord('user-123'))
    expect(result.current.effectiveDate).toBe('2026-03-12')
  })

  it('populates record when fetch returns data', async () => {
    const mockRecord = {
      id: 'record-123',
      user_id: 'user-123',
      date: '2026-03-12',
      sleep_start: null,
      sleep_end: null,
      breakfast: true,
      lunch: false,
      dinner: false,
      cipralex_taken: true,
      hygiene_done: false,
      movement_done: false,
      ground_maintenance_done: false,
      ground_build_done: false,
      note: 'test note',
      created_at: '2026-03-12T00:00:00.000Z',
      updated_at: '2026-03-12T00:00:00.000Z',
    }

    mockMaybeSingle.mockResolvedValueOnce({ data: mockRecord, error: null })

    const { result } = renderHook(() => useDailyRecord('user-123'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.record.breakfast).toBe(true)
    expect(result.current.record.cipralex_taken).toBe(true)
    expect(result.current.record.note).toBe('test note')
  })

  it('sets error on fetch failure', async () => {
    mockMaybeSingle.mockResolvedValueOnce({
      data: null,
      error: { message: 'Network error' },
    })

    const { result } = renderHook(() => useDailyRecord('user-123'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBe('Network error')
  })

  it('updates multiple fields optimistically', () => {
    const { result } = renderHook(() => useDailyRecord('user-123'))

    act(() => {
      result.current.updateField('breakfast', true)
      result.current.updateField('lunch', true)
      result.current.updateField('note', 'hello')
    })

    expect(result.current.record.breakfast).toBe(true)
    expect(result.current.record.lunch).toBe(true)
    expect(result.current.record.note).toBe('hello')
  })

  it('has setSleepStart and setSleepEnd functions', () => {
    const { result } = renderHook(() => useDailyRecord('user-123'))

    expect(typeof result.current.setSleepStart).toBe('function')
    expect(typeof result.current.setSleepEnd).toBe('function')
  })

  it('initializes with isLoading true', () => {
    const { result } = renderHook(() => useDailyRecord('user-123'))
    expect(result.current.isLoading).toBe(true)
  })

  it('initializes with no error', () => {
    const { result } = renderHook(() => useDailyRecord('user-123'))
    expect(result.current.error).toBeNull()
  })

  it('setSleepStart records a timestamp when none exists', async () => {
    const { result } = renderHook(() => useDailyRecord('user-123'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      result.current.setSleepStart()
    })

    expect(result.current.record.sleep_start).toBeTruthy()
    expect(typeof result.current.record.sleep_start).toBe('string')
    // Verify upsert was called (flush is called immediately for sleep)
    expect(mockUpsert).toHaveBeenCalled()
  })

  it('setSleepStart clears timestamp when one already exists', async () => {
    // Start with a record that has sleep_start set
    const mockRecord = {
      id: 'record-123',
      user_id: 'user-123',
      date: '2026-03-12',
      sleep_start: '2026-03-12T22:00:00.000Z',
      sleep_end: null,
      breakfast: false,
      lunch: false,
      dinner: false,
      cipralex_taken: false,
      hygiene_done: false,
      movement_done: false,
      ground_maintenance_done: false,
      ground_build_done: false,
      note: '',
      created_at: '2026-03-12T00:00:00.000Z',
      updated_at: '2026-03-12T00:00:00.000Z',
    }

    mockMaybeSingle.mockResolvedValueOnce({ data: mockRecord, error: null })

    const { result } = renderHook(() => useDailyRecord('user-123'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.record.sleep_start).toBe('2026-03-12T22:00:00.000Z')

    await act(async () => {
      result.current.setSleepStart()
    })

    // Toggle: existing timestamp -> null
    expect(result.current.record.sleep_start).toBeNull()
    expect(mockUpsert).toHaveBeenCalled()
  })

  it('setSleepEnd records a timestamp when none exists', async () => {
    const { result } = renderHook(() => useDailyRecord('user-123'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      result.current.setSleepEnd()
    })

    expect(result.current.record.sleep_end).toBeTruthy()
    expect(typeof result.current.record.sleep_end).toBe('string')
    expect(mockUpsert).toHaveBeenCalled()
  })

  it('setSleepEnd clears timestamp when one already exists', async () => {
    const mockRecord = {
      id: 'record-123',
      user_id: 'user-123',
      date: '2026-03-12',
      sleep_start: null,
      sleep_end: '2026-03-12T06:30:00.000Z',
      breakfast: false,
      lunch: false,
      dinner: false,
      cipralex_taken: false,
      hygiene_done: false,
      movement_done: false,
      ground_maintenance_done: false,
      ground_build_done: false,
      note: '',
      created_at: '2026-03-12T00:00:00.000Z',
      updated_at: '2026-03-12T00:00:00.000Z',
    }

    mockMaybeSingle.mockResolvedValueOnce({ data: mockRecord, error: null })

    const { result } = renderHook(() => useDailyRecord('user-123'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.record.sleep_end).toBe('2026-03-12T06:30:00.000Z')

    await act(async () => {
      result.current.setSleepEnd()
    })

    // Toggle: existing timestamp -> null
    expect(result.current.record.sleep_end).toBeNull()
    expect(mockUpsert).toHaveBeenCalled()
  })

  it('sets error when upsert fails during flush', async () => {
    // Mock upsert to return an error
    mockSingle.mockResolvedValue({
      data: null,
      error: { message: 'Upsert failed' },
    })

    const { result } = renderHook(() => useDailyRecord('user-123'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Use setSleepStart to trigger immediate flush (no debounce)
    await act(async () => {
      result.current.setSleepStart()
    })

    await waitFor(() => {
      expect(result.current.error).toBe('Upsert failed')
    })
  })

  it('debounced save calls upsert via flush', async () => {
    const { result } = renderHook(() => useDailyRecord('user-123'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Queue a pending update via updateField
    act(() => {
      result.current.updateField('breakfast', true)
    })

    // Flush via visibility change instead of waiting for debounce timer
    await act(async () => {
      Object.defineProperty(document, 'visibilityState', {
        value: 'hidden',
        writable: true,
        configurable: true,
      })
      document.dispatchEvent(new Event('visibilitychange'))
    })

    await waitFor(() => {
      expect(mockUpsert).toHaveBeenCalled()
    })

    const upsertPayload = mockUpsert.mock.calls[0][0]
    expect(upsertPayload.user_id).toBe('user-123')
    expect(upsertPayload.date).toBe('2026-03-12')
    expect(upsertPayload.breakfast).toBe(true)

    // Restore visibilityState
    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      writable: true,
      configurable: true,
    })
  })

  it('flushes pending save on visibility change to hidden', async () => {
    const { result } = renderHook(() => useDailyRecord('user-123'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Queue a pending update
    act(() => {
      result.current.updateField('lunch', true)
    })

    // Simulate visibility change to hidden
    await act(async () => {
      Object.defineProperty(document, 'visibilityState', {
        value: 'hidden',
        writable: true,
        configurable: true,
      })
      document.dispatchEvent(new Event('visibilitychange'))
    })

    await waitFor(() => {
      expect(mockUpsert).toHaveBeenCalled()
    })

    const upsertPayload = mockUpsert.mock.calls[0][0]
    expect(upsertPayload.lunch).toBe(true)

    // Restore visibilityState
    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      writable: true,
      configurable: true,
    })
  })

  it('visibility change to visible does not flush', async () => {
    const { result } = renderHook(() => useDailyRecord('user-123'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    act(() => {
      result.current.updateField('lunch', true)
    })

    // Simulate visibility change to visible (should NOT flush)
    await act(async () => {
      Object.defineProperty(document, 'visibilityState', {
        value: 'visible',
        writable: true,
        configurable: true,
      })
      document.dispatchEvent(new Event('visibilitychange'))
    })

    // Upsert should NOT have been called (not hidden)
    expect(mockUpsert).not.toHaveBeenCalled()
  })

  it('flush is a no-op when no pending updates exist', async () => {
    const { result } = renderHook(() => useDailyRecord('user-123'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Trigger visibility change without any pending updates
    await act(async () => {
      Object.defineProperty(document, 'visibilityState', {
        value: 'hidden',
        writable: true,
        configurable: true,
      })
      document.dispatchEvent(new Event('visibilitychange'))
    })

    // Upsert should NOT be called since there are no pending updates
    expect(mockUpsert).not.toHaveBeenCalled()

    // Restore visibilityState
    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      writable: true,
      configurable: true,
    })
  })

  it('cleans up visibility change listener on unmount', async () => {
    const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener')

    const { unmount } = renderHook(() => useDailyRecord('user-123'))

    unmount()

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'visibilitychange',
      expect.any(Function)
    )

    removeEventListenerSpy.mockRestore()
  })

  it('clears debounce timer on unmount before flush fires', async () => {
    const { result, unmount } = renderHook(() => useDailyRecord('user-123'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Queue an update (starts debounce timer)
    act(() => {
      result.current.updateField('dinner', true)
    })

    // Unmount before debounce fires -- cleanup effect clears the timer
    unmount()

    // Upsert should NOT have been called since debounce was cleared on unmount
    expect(mockUpsert).not.toHaveBeenCalled()
  })

  it('setSleepStart clears existing debounce timer before flushing', async () => {
    const { result } = renderHook(() => useDailyRecord('user-123'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Queue a debounced update
    act(() => {
      result.current.updateField('breakfast', true)
    })

    // Now call setSleepStart (should clear the debounce and flush immediately)
    await act(async () => {
      result.current.setSleepStart()
    })

    // The upsert should have been called
    await waitFor(() => {
      expect(mockUpsert).toHaveBeenCalled()
    })
  })
})
