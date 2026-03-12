import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

// Mock Supabase client
const mockSelect = vi.fn()
const mockEq = vi.fn()
const mockGte = vi.fn()
const mockLte = vi.fn()

function setupChain(resolvedValue: { data: unknown; error: unknown }) {
  const chain = {
    select: mockSelect,
    eq: mockEq,
    gte: mockGte,
    lte: mockLte,
  }
  mockSelect.mockReturnValue(chain)
  mockEq.mockReturnValue(chain)
  mockGte.mockReturnValue(chain)
  mockLte.mockResolvedValue(resolvedValue)
  return chain
}

const mockFrom = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: mockFrom,
  }),
}))

// Mock dates to control the 7-day window
vi.mock('@/lib/dates', () => ({
  getEffectiveDate: () => '2026-03-12',
  formatDateString: (d: Date) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  },
}))

import { useGroundIntegrity, getLastSevenDates, recordToIntegrity } from './use-ground-integrity'

describe('getLastSevenDates', () => {
  it('returns 7 dates ending with effective date', () => {
    const dates = getLastSevenDates()
    expect(dates).toHaveLength(7)
    expect(dates[6]).toBe('2026-03-12')
    expect(dates[0]).toBe('2026-03-06')
  })
})

describe('recordToIntegrity', () => {
  it('returns all false for undefined record', () => {
    const result = recordToIntegrity('2026-03-12', undefined)
    expect(result).toEqual({
      date: '2026-03-12',
      sleep: false,
      food: false,
      medication: false,
      body: false,
      ground: false,
    })
  })

  it('returns true for sleep when both start and end present', () => {
    const record = {
      id: '1', user_id: 'u1', date: '2026-03-12',
      sleep_start: '2026-03-11T23:00:00Z', sleep_end: '2026-03-12T07:00:00Z',
      breakfast: false, lunch: false, dinner: false,
      cipralex_taken: false, hygiene_done: false, movement_done: false,
      ground_maintenance_done: false, ground_build_done: false,
      note: '', created_at: '', updated_at: '',
    }
    const result = recordToIntegrity('2026-03-12', record)
    expect(result.sleep).toBe(true)
    expect(result.food).toBe(false)
  })

  it('returns true for food only when all three meals present', () => {
    const record = {
      id: '1', user_id: 'u1', date: '2026-03-12',
      sleep_start: null, sleep_end: null,
      breakfast: true, lunch: true, dinner: true,
      cipralex_taken: false, hygiene_done: false, movement_done: false,
      ground_maintenance_done: false, ground_build_done: false,
      note: '', created_at: '', updated_at: '',
    }
    expect(recordToIntegrity('2026-03-12', record).food).toBe(true)
  })

  it('returns false for food when partial meals', () => {
    const record = {
      id: '1', user_id: 'u1', date: '2026-03-12',
      sleep_start: null, sleep_end: null,
      breakfast: true, lunch: false, dinner: true,
      cipralex_taken: false, hygiene_done: false, movement_done: false,
      ground_maintenance_done: false, ground_build_done: false,
      note: '', created_at: '', updated_at: '',
    }
    expect(recordToIntegrity('2026-03-12', record).food).toBe(false)
  })

  it('returns true for ground when either maintenance or build done', () => {
    const record = {
      id: '1', user_id: 'u1', date: '2026-03-12',
      sleep_start: null, sleep_end: null,
      breakfast: false, lunch: false, dinner: false,
      cipralex_taken: false, hygiene_done: false, movement_done: false,
      ground_maintenance_done: true, ground_build_done: false,
      note: '', created_at: '', updated_at: '',
    }
    expect(recordToIntegrity('2026-03-12', record).ground).toBe(true)
  })

  it('returns true for body when both hygiene and movement done', () => {
    const record = {
      id: '1', user_id: 'u1', date: '2026-03-12',
      sleep_start: null, sleep_end: null,
      breakfast: false, lunch: false, dinner: false,
      cipralex_taken: false, hygiene_done: true, movement_done: true,
      ground_maintenance_done: false, ground_build_done: false,
      note: '', created_at: '', updated_at: '',
    }
    expect(recordToIntegrity('2026-03-12', record).body).toBe(true)
  })
})

describe('useGroundIntegrity', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupChain({ data: [], error: null })
    mockFrom.mockReturnValue({
      select: mockSelect,
      eq: mockEq,
      gte: mockGte,
      lte: mockLte,
    })
  })

  it('starts with loading state and empty integrity', () => {
    const { result } = renderHook(() => useGroundIntegrity('user-123'))
    expect(result.current.isLoading).toBe(true)
    expect(result.current.days).toHaveLength(7)
    expect(result.current.days[0].sleep).toBe(false)
  })

  it('fetches records and maps to integrity', async () => {
    setupChain({
      data: [
        {
          id: '1', user_id: 'user-123', date: '2026-03-12',
          sleep_start: '2026-03-11T23:00:00Z', sleep_end: '2026-03-12T07:00:00Z',
          breakfast: true, lunch: true, dinner: true,
          cipralex_taken: true, hygiene_done: true, movement_done: true,
          ground_maintenance_done: true, ground_build_done: false,
          note: '', created_at: '', updated_at: '',
        },
      ],
      error: null,
    })
    mockFrom.mockReturnValue({
      select: mockSelect,
      eq: mockEq,
      gte: mockGte,
      lte: mockLte,
    })

    const { result } = renderHook(() => useGroundIntegrity('user-123'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Last day (index 6) should have all true
    const today = result.current.days[6]
    expect(today.sleep).toBe(true)
    expect(today.food).toBe(true)
    expect(today.medication).toBe(true)
    expect(today.body).toBe(true)
    expect(today.ground).toBe(true)

    // Earlier days should be false (no data)
    expect(result.current.days[0].sleep).toBe(false)
  })

  it('handles fetch error gracefully', async () => {
    setupChain({
      data: null,
      error: { message: 'Network error' },
    })
    mockFrom.mockReturnValue({
      select: mockSelect,
      eq: mockEq,
      gte: mockGte,
      lte: mockLte,
    })

    const { result } = renderHook(() => useGroundIntegrity('user-123'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBe('Network error')
  })
})
