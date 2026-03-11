import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'user-123' } },
      }),
    },
  }),
}))

// Mock useDailyRecord
vi.mock('@/hooks/use-daily-record', () => ({
  useDailyRecord: () => ({
    record: {
      date: '2026-03-12',
      sleep_start: null,
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
    },
    error: null,
    updateField: vi.fn(),
    setSleepStart: vi.fn(),
    setSleepEnd: vi.fn(),
  }),
}))

// Mock useActiveProjectName
vi.mock('@/hooks/use-active-project-name', () => ({
  useActiveProjectName: () => ({
    projectName: 'Build SelahOS',
    isLoading: false,
  }),
}))

// Mock dates for DateHeader
vi.mock('@/lib/dates', () => ({
  getEffectiveDate: () => '2026-03-12',
  formatDisplayDate: () => 'Thursday, March 12',
}))

import TodayPage from './page'

describe('TodayPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders all sections after user loads', async () => {
    render(<TodayPage />)

    await waitFor(() => {
      expect(screen.getByText('sleep')).toBeInTheDocument()
    })

    expect(screen.getByText('food')).toBeInTheDocument()
    expect(screen.getByText('medication')).toBeInTheDocument()
    expect(screen.getByText('body')).toBeInTheDocument()
    expect(screen.getByText('ground')).toBeInTheDocument()
    expect(screen.getByText('note')).toBeInTheDocument()
  })

  it('shows date header', async () => {
    render(<TodayPage />)

    await waitFor(() => {
      expect(screen.getByText('Thursday, March 12')).toBeInTheDocument()
    })
  })

  it('shows active project name in ground section', async () => {
    render(<TodayPage />)

    await waitFor(() => {
      expect(screen.getByText('Build SelahOS')).toBeInTheDocument()
    })
  })
})
