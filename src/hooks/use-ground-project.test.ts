import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'

// Mock Supabase client
// The chain needs to support:
//   .from().select().eq().eq().maybeSingle()  -- for fetch
//   .from().update().eq().select().single()   -- for updateName/toggleStatus
//   .from().update().eq()                     -- for deactivation (no select/single)
//   .from().insert().select().single()        -- for createProject

const mockMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null })
const mockSingle = vi.fn().mockResolvedValue({ data: {}, error: null })

// Build a fully chainable mock where every method returns `this`
// except terminal methods (maybeSingle, single)
function createChainMock() {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {}
  chain.select = vi.fn().mockImplementation(() => chain)
  chain.eq = vi.fn().mockImplementation(() => chain)
  chain.update = vi.fn().mockImplementation(() => chain)
  chain.insert = vi.fn().mockImplementation(() => chain)
  chain.maybeSingle = mockMaybeSingle
  chain.single = mockSingle
  return chain
}

const mockChain = createChainMock()
const mockFrom = vi.fn().mockImplementation(() => mockChain)

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: mockFrom,
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-123' } } }),
    },
  }),
}))

import { useGroundProject } from './use-ground-project'

// Test data factory
function createMockGroundProject(overrides: Record<string, unknown> = {}) {
  return {
    id: 'project-123',
    user_id: 'user-123',
    name: 'Test Project',
    status: 'active',
    start_date: '2026-03-01',
    created_at: '2026-03-01T00:00:00.000Z',
    updated_at: '2026-03-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('useGroundProject', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Re-setup the chain after clearing mocks
    mockChain.select.mockImplementation(() => mockChain)
    mockChain.eq.mockImplementation(() => mockChain)
    mockChain.update.mockImplementation(() => mockChain)
    mockChain.insert.mockImplementation(() => mockChain)
    mockChain.maybeSingle = mockMaybeSingle
    mockChain.single = mockSingle
    mockFrom.mockImplementation(() => mockChain)
    mockMaybeSingle.mockResolvedValue({ data: null, error: null })
    mockSingle.mockResolvedValue({ data: {}, error: null })
  })

  it('initializes with isLoading true', () => {
    const { result } = renderHook(() => useGroundProject('user-123'))
    expect(result.current.isLoading).toBe(true)
  })

  it('initializes with no error', () => {
    const { result } = renderHook(() => useGroundProject('user-123'))
    expect(result.current.error).toBeNull()
  })

  it('fetches active project on mount', async () => {
    const mockProject = createMockGroundProject()
    mockMaybeSingle.mockResolvedValueOnce({ data: mockProject, error: null })

    const { result } = renderHook(() => useGroundProject('user-123'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.project).toEqual(mockProject)
    expect(mockFrom).toHaveBeenCalledWith('ground_projects')
  })

  it('returns null project when no active project exists', async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null })

    const { result } = renderHook(() => useGroundProject('user-123'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.project).toBeNull()
  })

  it('sets error on fetch failure', async () => {
    mockMaybeSingle.mockResolvedValueOnce({
      data: null,
      error: { message: 'Network error' },
    })

    const { result } = renderHook(() => useGroundProject('user-123'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBe('Network error')
  })

  it('updateName optimistically updates name and persists', async () => {
    const mockProject = createMockGroundProject()
    mockMaybeSingle.mockResolvedValueOnce({ data: mockProject, error: null })
    const updatedProject = createMockGroundProject({ name: 'New Name' })
    mockSingle.mockResolvedValueOnce({ data: updatedProject, error: null })

    const { result } = renderHook(() => useGroundProject('user-123'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.updateName('New Name')
    })

    expect(result.current.project?.name).toBe('New Name')
    expect(mockChain.update).toHaveBeenCalledWith({ name: 'New Name' })
  })

  it('updateName reverts on error', async () => {
    const mockProject = createMockGroundProject({ name: 'Original' })
    mockMaybeSingle.mockResolvedValueOnce({ data: mockProject, error: null })
    mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'Update failed' } })

    const { result } = renderHook(() => useGroundProject('user-123'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.updateName('New Name')
    })

    expect(result.current.error).toBe('Update failed')
    expect(result.current.project?.name).toBe('Original')
  })

  it('updateName rejects empty string', async () => {
    const mockProject = createMockGroundProject()
    mockMaybeSingle.mockResolvedValueOnce({ data: mockProject, error: null })

    const { result } = renderHook(() => useGroundProject('user-123'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.updateName('')
    })

    expect(mockChain.update).not.toHaveBeenCalled()
    expect(result.current.project?.name).toBe('Test Project')
  })

  it('updateName rejects whitespace-only string', async () => {
    const mockProject = createMockGroundProject()
    mockMaybeSingle.mockResolvedValueOnce({ data: mockProject, error: null })

    const { result } = renderHook(() => useGroundProject('user-123'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.updateName('   ')
    })

    expect(mockChain.update).not.toHaveBeenCalled()
  })

  it('toggleStatus switches from active to paused', async () => {
    const mockProject = createMockGroundProject({ status: 'active' })
    mockMaybeSingle.mockResolvedValueOnce({ data: mockProject, error: null })
    const updated = createMockGroundProject({ status: 'paused' })
    mockSingle.mockResolvedValueOnce({ data: updated, error: null })

    const { result } = renderHook(() => useGroundProject('user-123'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.toggleStatus()
    })

    expect(result.current.project?.status).toBe('paused')
    expect(mockChain.update).toHaveBeenCalledWith({ status: 'paused' })
  })

  it('toggleStatus switches from paused to active', async () => {
    const mockProject = createMockGroundProject({ status: 'paused' })
    mockMaybeSingle.mockResolvedValueOnce({ data: mockProject, error: null })
    const updated = createMockGroundProject({ status: 'active' })
    mockSingle.mockResolvedValueOnce({ data: updated, error: null })

    const { result } = renderHook(() => useGroundProject('user-123'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.toggleStatus()
    })

    expect(result.current.project?.status).toBe('active')
    expect(mockChain.update).toHaveBeenCalledWith({ status: 'active' })
  })

  it('toggleStatus reverts on error', async () => {
    const mockProject = createMockGroundProject({ status: 'active' })
    mockMaybeSingle.mockResolvedValueOnce({ data: mockProject, error: null })
    mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'Toggle failed' } })

    const { result } = renderHook(() => useGroundProject('user-123'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.toggleStatus()
    })

    expect(result.current.error).toBe('Toggle failed')
    expect(result.current.project?.status).toBe('active')
  })

  it('createProject inserts new project when no active project', async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null })
    const newProject = createMockGroundProject({ name: 'New Project' })
    mockSingle.mockResolvedValueOnce({ data: newProject, error: null })

    const { result } = renderHook(() => useGroundProject('user-123'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.createProject('New Project')
    })

    expect(result.current.project?.name).toBe('New Project')
    expect(mockChain.insert).toHaveBeenCalledWith({
      user_id: 'user-123',
      name: 'New Project',
      status: 'active',
    })
  })

  it('createProject deactivates previous project then inserts new', async () => {
    const oldProject = createMockGroundProject({ name: 'Old Project' })
    mockMaybeSingle.mockResolvedValueOnce({ data: oldProject, error: null })

    // The hook calls:
    // 1. supabase.from().update({status:'completed'}).eq() -- deactivation
    // 2. supabase.from().insert({...}).select().single()   -- new project
    // Both go through the same chain. We need eq() on deactivation to resolve
    // with no error, then single() on insert to return new project.

    // For deactivation: .update().eq() -- eq returns the chain which has no error property
    // Actually the hook destructures { error: deactivateError } from the eq() result.
    // Since eq() returns the chain object, and chain has no 'error' property,
    // deactivateError will be undefined (falsy) -- so deactivation "succeeds".

    const newProject = createMockGroundProject({ id: 'project-456', name: 'New Project' })
    mockSingle.mockResolvedValueOnce({ data: newProject, error: null })

    const { result } = renderHook(() => useGroundProject('user-123'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.createProject('New Project')
    })

    expect(result.current.project?.name).toBe('New Project')
    expect(mockChain.update).toHaveBeenCalledWith({ status: 'completed' })
    expect(mockChain.insert).toHaveBeenCalled()
  })

  it('createProject re-activates old project if insert fails', async () => {
    const oldProject = createMockGroundProject({ name: 'Old Project' })
    mockMaybeSingle.mockResolvedValueOnce({ data: oldProject, error: null })

    // Deactivation succeeds (eq returns chain, no error property)
    // Insert fails
    mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'Duplicate name' } })

    const { result } = renderHook(() => useGroundProject('user-123'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.createProject('Duplicate')
    })

    expect(result.current.error).toBe('Duplicate name')
    expect(result.current.project).toEqual(oldProject)
  })

  it('createProject rejects empty name', async () => {
    const { result } = renderHook(() => useGroundProject('user-123'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.createProject('')
    })

    expect(mockChain.insert).not.toHaveBeenCalled()
  })

  it('createProject handles deactivation failure', async () => {
    const oldProject = createMockGroundProject()
    mockMaybeSingle.mockResolvedValueOnce({ data: oldProject, error: null })

    // Make eq() return an object with an error for the deactivation call
    // The deactivation chain: .from().update().eq() -> { error }
    // We need .eq() to return { error: { message: 'Deactivation failed' } } for this call
    // But eq is also used for the initial fetch chain. We need to be careful.
    // The deactivation call is: supabase.from().update({status:'completed'}).eq('id', ...)
    // After fetch completes, update().eq() is called.
    // We can use mockImplementationOnce on eq to return error for the deactivation.

    const { result } = renderHook(() => useGroundProject('user-123'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Now override eq to return error for the next call (deactivation)
    mockChain.eq.mockReturnValueOnce({ error: { message: 'Deactivation failed' } })

    await act(async () => {
      await result.current.createProject('New Project')
    })

    expect(result.current.error).toBe('Deactivation failed')
    expect(mockChain.insert).not.toHaveBeenCalled()
  })

  it('updateName does nothing when no project exists', async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null })

    const { result } = renderHook(() => useGroundProject('user-123'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.updateName('Some Name')
    })

    expect(mockChain.update).not.toHaveBeenCalled()
  })

  it('toggleStatus does nothing when no project exists', async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null })

    const { result } = renderHook(() => useGroundProject('user-123'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.toggleStatus()
    })

    expect(mockChain.update).not.toHaveBeenCalled()
  })
})
