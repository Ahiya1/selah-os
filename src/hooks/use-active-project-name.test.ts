import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

// Mock Supabase client
const mockMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null })

function createFromMock() {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: mockMaybeSingle,
  }
  chain.select.mockReturnValue(chain)
  chain.eq.mockReturnValue(chain)
  return vi.fn().mockReturnValue(chain)
}

const mockFrom = createFromMock()

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: mockFrom,
  }),
}))

import { useActiveProjectName } from './use-active-project-name'

describe('useActiveProjectName', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Re-setup the chain after clearing mocks
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: mockMaybeSingle,
    }
    chain.select.mockReturnValue(chain)
    chain.eq.mockReturnValue(chain)
    mockFrom.mockReturnValue(chain)
    mockMaybeSingle.mockResolvedValue({ data: null, error: null })
  })

  it('returns project name when active project exists', async () => {
    mockMaybeSingle.mockResolvedValueOnce({
      data: { name: 'Build SelahOS' },
      error: null,
    })

    const { result } = renderHook(() => useActiveProjectName('user-123'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.projectName).toBe('Build SelahOS')
  })

  it('returns null when no active project exists', async () => {
    mockMaybeSingle.mockResolvedValueOnce({
      data: null,
      error: null,
    })

    const { result } = renderHook(() => useActiveProjectName('user-123'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.projectName).toBeNull()
  })

  it('starts with isLoading true', () => {
    const { result } = renderHook(() => useActiveProjectName('user-123'))

    expect(result.current.isLoading).toBe(true)
    expect(result.current.projectName).toBeNull()
  })

  it('returns null when fetch errors (graceful degradation)', async () => {
    mockMaybeSingle.mockResolvedValueOnce({
      data: null,
      error: { message: 'Network error' },
    })

    const { result } = renderHook(() => useActiveProjectName('user-123'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.projectName).toBeNull()
  })
})
