import { describe, it, expect } from 'vitest'
import { toJourneyDay, ANCHOR_COUNT } from './use-journey'
import type { Database } from '@/lib/types'

type DailyRecord = Database['public']['Tables']['daily_records']['Row']

function record(overrides: Partial<DailyRecord> = {}): DailyRecord {
  return {
    id: 'rec-1',
    user_id: 'user-1',
    date: '2026-08-12',
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
    rest_done: null,
    breakfast_at: null,
    lunch_at: null,
    dinner_at: null,
    cipralex_taken_at: null,
    hygiene_done_at: null,
    movement_done_at: null,
    ground_maintenance_done_at: null,
    ground_build_done_at: null,
    rest_done_at: null,
    note: '',
    created_at: '2026-08-12T00:00:00.000Z',
    updated_at: '2026-08-12T00:00:00.000Z',
    ...overrides,
  }
}

const fullDay: Partial<DailyRecord> = {
  sleep_start: '2026-08-12T23:00:00.000Z',
  sleep_end: '2026-08-13T07:00:00.000Z',
  breakfast: true,
  lunch: true,
  dinner: true,
  cipralex_taken: true,
  hygiene_done: true,
  movement_done: true,
  ground_maintenance_done: true,
  ground_build_done: true,
}

describe('toJourneyDay', () => {
  it('is low ground on a day never touched', () => {
    // 2026-08-12 is a Wednesday.
    expect(toJourneyDay('2026-08-12', undefined)).toEqual({
      date: '2026-08-12',
      held: 0,
    })
  })

  it('reaches full height when the whole ground was held', () => {
    const day = toJourneyDay('2026-08-12', record(fullDay))
    expect(day.held).toBe(ANCHOR_COUNT)
  })

  it('rises partway when some of the ground was held', () => {
    const day = toJourneyDay(
      '2026-08-12',
      record({ cipralex_taken: true, hygiene_done: true, movement_done: true })
    )
    // medication and body, not sleep, food, or ground.
    expect(day.held).toBe(2)
  })

  it('counts food only when the whole day was eaten', () => {
    const partial = toJourneyDay('2026-08-12', record({ breakfast: true, lunch: true }))
    expect(partial.held).toBe(0)
    const whole = toJourneyDay(
      '2026-08-12',
      record({ breakfast: true, lunch: true, dinner: true })
    )
    expect(whole.held).toBe(1)
  })

  it('follows the week: Saturday holds its ground by resting', () => {
    // 2026-08-15 is a Saturday. Rest alone counts as ground held.
    const resting = toJourneyDay('2026-08-15', record({ rest_done: true }))
    expect(resting.held).toBe(1)
    // Maintenance on Shabbat is not what that day's ground asks for.
    const working = toJourneyDay(
      '2026-08-15',
      record({ ground_maintenance_done: true })
    )
    expect(working.held).toBe(0)
  })

  it('follows the week: Friday needs only maintenance', () => {
    // 2026-08-14 is a Friday.
    const day = toJourneyDay('2026-08-14', record({ ground_maintenance_done: true }))
    expect(day.held).toBe(1)
  })

  it('never exceeds the height of a whole day', () => {
    const day = toJourneyDay('2026-08-12', record({ ...fullDay, rest_done: true }))
    expect(day.held).toBeLessThanOrEqual(ANCHOR_COUNT)
  })
})
