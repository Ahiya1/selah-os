import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

// Mock Supabase client with fully chainable mock
const mockMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null })
const mockSingle = vi.fn().mockResolvedValue({ data: {}, error: null })

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
const mockGetUser = vi.fn().mockResolvedValue({
  data: { user: { id: 'user-123' } },
})

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: mockFrom,
    auth: {
      getUser: mockGetUser,
    },
  }),
}))

import ProjectPage from './page'

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

describe('ProjectPage', () => {
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
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
    })
  })

  it('renders loading state initially before user loads', () => {
    mockGetUser.mockReturnValue(new Promise(() => {}))
    const { container } = render(<ProjectPage />)
    expect(container.querySelector('.p-4')).toBeInTheDocument()
  })

  it('displays page heading after user loads', async () => {
    render(<ProjectPage />)
    await waitFor(() => {
      expect(screen.getByText('ground project')).toBeInTheDocument()
    })
  })

  it('displays project name when active project exists', async () => {
    const mockProject = createMockGroundProject({ name: 'My Project' })
    mockMaybeSingle.mockResolvedValueOnce({ data: mockProject, error: null })

    render(<ProjectPage />)

    await waitFor(() => {
      expect(screen.getByText('My Project')).toBeInTheDocument()
    })
  })

  it('displays project status and start date', async () => {
    const mockProject = createMockGroundProject({ status: 'active', start_date: '2026-03-01' })
    mockMaybeSingle.mockResolvedValueOnce({ data: mockProject, error: null })

    render(<ProjectPage />)

    await waitFor(() => {
      expect(screen.getByText('active')).toBeInTheDocument()
      expect(screen.getByText('since Mar 1, 2026')).toBeInTheDocument()
    })
  })

  it('shows empty state when no active project', async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null })

    render(<ProjectPage />)

    await waitFor(() => {
      expect(screen.getByText('no active project')).toBeInTheDocument()
    })
  })

  it('enters edit mode when project name is clicked', async () => {
    const mockProject = createMockGroundProject({ name: 'Test Project' })
    mockMaybeSingle.mockResolvedValueOnce({ data: mockProject, error: null })

    render(<ProjectPage />)

    await waitFor(() => {
      expect(screen.getByText('Test Project')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Test Project'))

    expect(screen.getByDisplayValue('Test Project')).toBeInTheDocument()
    expect(screen.getByText('save')).toBeInTheDocument()
    expect(screen.getByText('cancel')).toBeInTheDocument()
  })

  it('cancels name edit without saving', async () => {
    const mockProject = createMockGroundProject({ name: 'Test Project' })
    mockMaybeSingle.mockResolvedValueOnce({ data: mockProject, error: null })

    render(<ProjectPage />)

    await waitFor(() => {
      expect(screen.getByText('Test Project')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Test Project'))
    fireEvent.click(screen.getByText('cancel'))

    expect(screen.getByText('Test Project')).toBeInTheDocument()
    expect(mockChain.update).not.toHaveBeenCalled()
  })

  it('shows create form when new project button is clicked', async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null })

    render(<ProjectPage />)

    await waitFor(() => {
      expect(screen.getByText('+ new project')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('+ new project'))

    expect(screen.getByPlaceholderText('new project name')).toBeInTheDocument()
    expect(screen.getByText('create')).toBeInTheDocument()
  })

  it('cancels create form', async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null })

    render(<ProjectPage />)

    await waitFor(() => {
      expect(screen.getByText('+ new project')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('+ new project'))
    fireEvent.click(screen.getByText('cancel'))

    expect(screen.getByText('+ new project')).toBeInTheDocument()
  })

  it('displays error message with role alert', async () => {
    mockMaybeSingle.mockResolvedValueOnce({
      data: null,
      error: { message: 'Something went wrong' },
    })

    render(<ProjectPage />)

    await waitFor(() => {
      const alert = screen.getByRole('alert')
      expect(alert).toBeInTheDocument()
      expect(alert).toHaveTextContent('Something went wrong')
    })
  })

  it('has new project button available when project exists', async () => {
    const mockProject = createMockGroundProject()
    mockMaybeSingle.mockResolvedValueOnce({ data: mockProject, error: null })

    render(<ProjectPage />)

    await waitFor(() => {
      expect(screen.getByText('+ new project')).toBeInTheDocument()
    })
  })
})
