import { describe, it, expect } from 'vitest'
import type { Database } from './types'

describe('Database types', () => {
  it('daily_records Row type has all required fields', () => {
    // Type-level test: verify the structure compiles correctly
    const mockRow: Database['public']['Tables']['daily_records']['Row'] = {
      id: 'test-id',
      user_id: 'user-id',
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
      created_at: '2026-03-12T00:00:00.000Z',
      updated_at: '2026-03-12T00:00:00.000Z',
    }
    expect(mockRow.id).toBe('test-id')
    expect(mockRow.breakfast).toBe(false)
    expect(mockRow.note).toBe('')
    expect(mockRow.sleep_start).toBeNull()
  })

  it('daily_records Insert type allows optional server-generated fields', () => {
    const mockInsert: Database['public']['Tables']['daily_records']['Insert'] = {
      user_id: 'user-id',
      date: '2026-03-12',
    }
    expect(mockInsert.user_id).toBe('user-id')
    expect(mockInsert.date).toBe('2026-03-12')
    expect(mockInsert.id).toBeUndefined()
  })

  it('daily_records Update type allows all fields as optional', () => {
    const mockUpdate: Database['public']['Tables']['daily_records']['Update'] = {
      breakfast: true,
    }
    expect(mockUpdate.breakfast).toBe(true)
    expect(mockUpdate.user_id).toBeUndefined()
  })

  it('ground_projects Row type has status field', () => {
    const mockRow: Database['public']['Tables']['ground_projects']['Row'] = {
      id: 'proj-id',
      user_id: 'user-id',
      name: 'Test Project',
      status: 'active',
      start_date: '2026-03-12',
      created_at: '2026-03-12T00:00:00.000Z',
      updated_at: '2026-03-12T00:00:00.000Z',
    }
    expect(mockRow.status).toBe('active')
    expect(mockRow.name).toBe('Test Project')
  })

  it('weekly_signals Row type has all signal fields', () => {
    const mockRow: Database['public']['Tables']['weekly_signals']['Row'] = {
      id: 'signal-id',
      user_id: 'user-id',
      week_start: '2026-03-09',
      financial_note: '',
      sleep_state: '',
      note: '',
      created_at: '2026-03-12T00:00:00.000Z',
      updated_at: '2026-03-12T00:00:00.000Z',
    }
    expect(mockRow.week_start).toBe('2026-03-09')
    expect(mockRow.financial_note).toBe('')
  })
})
