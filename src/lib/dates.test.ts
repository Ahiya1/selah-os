import { describe, it, expect, vi, afterEach } from 'vitest'
import { getEffectiveDate, formatDisplayDate, formatTime, formatDateString, getWeekStart } from './dates'

describe('getEffectiveDate', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns today when time is after 4:00 AM', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-12T08:30:00'))
    expect(getEffectiveDate()).toBe('2026-03-12')
  })

  it('returns yesterday when time is before 4:00 AM', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-12T02:30:00'))
    expect(getEffectiveDate()).toBe('2026-03-11')
  })

  it('returns today at exactly 4:00 AM', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-12T04:00:00'))
    expect(getEffectiveDate()).toBe('2026-03-12')
  })

  it('handles midnight correctly (returns yesterday)', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-12T00:00:00'))
    expect(getEffectiveDate()).toBe('2026-03-11')
  })

  it('handles 3:59 AM (returns yesterday)', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-12T03:59:59'))
    expect(getEffectiveDate()).toBe('2026-03-11')
  })

  it('accepts a custom Date parameter', () => {
    const customDate = new Date('2026-06-15T10:00:00')
    expect(getEffectiveDate(customDate)).toBe('2026-06-15')
  })

  it('returns previous day for custom Date before 4 AM', () => {
    const customDate = new Date('2026-06-15T01:30:00')
    expect(getEffectiveDate(customDate)).toBe('2026-06-14')
  })

  it('handles month boundary correctly', () => {
    vi.useFakeTimers()
    // March 1st at 1 AM should return Feb 28 (non-leap year 2026)
    vi.setSystemTime(new Date('2026-03-01T01:00:00'))
    expect(getEffectiveDate()).toBe('2026-02-28')
  })

  it('handles year boundary correctly', () => {
    vi.useFakeTimers()
    // January 1st at 2 AM should return December 31 of previous year
    vi.setSystemTime(new Date('2026-01-01T02:00:00'))
    expect(getEffectiveDate()).toBe('2025-12-31')
  })
})

describe('formatDateString', () => {
  it('formats a date as YYYY-MM-DD', () => {
    const date = new Date(2026, 2, 12) // March 12, 2026
    expect(formatDateString(date)).toBe('2026-03-12')
  })

  it('pads single-digit month and day', () => {
    const date = new Date(2026, 0, 5) // January 5, 2026
    expect(formatDateString(date)).toBe('2026-01-05')
  })
})

describe('formatDisplayDate', () => {
  it('formats date string for display with weekday and month', () => {
    const result = formatDisplayDate('2026-03-12')
    expect(result).toContain('March')
    expect(result).toContain('12')
  })

  it('includes the weekday name', () => {
    const result = formatDisplayDate('2026-03-12')
    // March 12, 2026 is a Thursday
    expect(result).toContain('Thursday')
  })

  it('handles different dates correctly', () => {
    const result = formatDisplayDate('2026-01-01')
    expect(result).toContain('January')
    expect(result).toContain('1')
  })
})

describe('formatTime', () => {
  it('formats ISO timestamp to HH:MM', () => {
    const result = formatTime('2026-03-12T07:14:00.000Z')
    // Contains hour and minute (exact format depends on locale/timezone)
    expect(result).toMatch(/\d{2}:\d{2}/)
  })

  it('formats another timestamp correctly', () => {
    const result = formatTime('2026-03-12T22:45:00.000Z')
    expect(result).toMatch(/\d{2}:\d{2}/)
  })
})

describe('getWeekStart', () => {
  it('returns Monday for a Wednesday', () => {
    // March 12, 2026 is a Thursday
    const date = new Date('2026-03-12T10:00:00')
    expect(getWeekStart(date)).toBe('2026-03-09')
  })

  it('returns Monday for a Monday', () => {
    // March 9, 2026 is a Monday
    const date = new Date('2026-03-09T10:00:00')
    expect(getWeekStart(date)).toBe('2026-03-09')
  })

  it('returns previous Monday for a Sunday', () => {
    // March 15, 2026 is a Sunday
    const date = new Date('2026-03-15T10:00:00')
    expect(getWeekStart(date)).toBe('2026-03-09')
  })
})
