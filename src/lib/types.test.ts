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
      breakfast: null,
      lunch: null,
      dinner: null,
      cipralex_taken: null,
      hygiene_done: null,
      movement_done: null,
      ground_maintenance_done: null,
      ground_build_done: null,
      note: '',
      created_at: '2026-03-12T00:00:00.000Z',
      updated_at: '2026-03-12T00:00:00.000Z',
    }
    expect(mockRow.id).toBe('test-id')
    expect(mockRow.breakfast).toBeNull()
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

})
