import { describe, it, expect } from 'vitest'
import { isReturnOpen, daysBetween, datesFrom, CYCLE_ANCHOR } from './return-window'

// CYCLE_ANCHOR is 2026-08-15, a Saturday.
const anchorMotzash = (h: number, m = 0) => new Date(2026, 7, 15, h, m)

describe('isReturnOpen', () => {
  it('opens on the anchor Motzash after nightfall', () => {
    expect(isReturnOpen(anchorMotzash(20))).toBe(true)
    expect(isReturnOpen(anchorMotzash(23, 30))).toBe(true)
  })

  it('stays shut through Shabbat itself', () => {
    expect(isReturnOpen(anchorMotzash(9))).toBe(false)
    expect(isReturnOpen(anchorMotzash(17))).toBe(false)
    expect(isReturnOpen(anchorMotzash(19, 59))).toBe(false)
  })

  it('stays open past midnight, until the day turns at 4:00', () => {
    // Still Saturday's effective date until the 4:00 boundary.
    expect(isReturnOpen(new Date(2026, 7, 16, 1, 0))).toBe(true)
    expect(isReturnOpen(new Date(2026, 7, 16, 3, 59))).toBe(true)
    // Sunday proper.
    expect(isReturnOpen(new Date(2026, 7, 16, 4, 0))).toBe(false)
    expect(isReturnOpen(new Date(2026, 7, 16, 21, 0))).toBe(false)
  })

  it('skips the Motzash in between', () => {
    // One week on: a Saturday night, but the wrong one.
    expect(isReturnOpen(new Date(2026, 7, 22, 21, 0))).toBe(false)
  })

  it('opens again two weeks on, and keeps that cadence', () => {
    expect(isReturnOpen(new Date(2026, 7, 29, 21, 0))).toBe(true)
    expect(isReturnOpen(new Date(2026, 8, 5, 21, 0))).toBe(false)
    expect(isReturnOpen(new Date(2026, 8, 12, 21, 0))).toBe(true)
  })

  it('holds the cadence across a daylight saving change', () => {
    // Israel moves its clocks in late October; the parity must not drift.
    const weeksOut = (n: number) => {
      const d = new Date(2026, 7, 15, 21, 0)
      d.setDate(d.getDate() + n * 7)
      return d
    }
    for (let n = 0; n <= 20; n++) {
      expect(isReturnOpen(weeksOut(n))).toBe(n % 2 === 0)
    }
  })

  it('never opens on a day that is not Saturday', () => {
    for (let day = 16; day <= 21; day++) {
      expect(isReturnOpen(new Date(2026, 7, day, 21, 0))).toBe(false)
    }
  })
})

describe('daysBetween', () => {
  it('counts whole days forward', () => {
    expect(daysBetween('2026-08-15', '2026-08-15')).toBe(0)
    expect(daysBetween('2026-08-15', '2026-08-29')).toBe(14)
  })

  it('counts backward as negative', () => {
    expect(daysBetween('2026-08-29', '2026-08-15')).toBe(-14)
  })

  it('is unbothered by daylight saving', () => {
    // Spans Israel's autumn clock change.
    expect(daysBetween('2026-10-01', '2026-11-01')).toBe(31)
  })

  it('agrees with the cycle anchor being a Saturday', () => {
    expect(daysBetween(CYCLE_ANCHOR, '2026-08-29') % 7).toBe(0)
  })
})

describe('datesFrom', () => {
  it('runs continuously, leaving no day out', () => {
    expect(datesFrom('2026-08-14', '2026-08-17')).toEqual([
      '2026-08-14',
      '2026-08-15',
      '2026-08-16',
      '2026-08-17',
    ])
  })

  it('returns a single day when start and end are the same', () => {
    expect(datesFrom('2026-08-15', '2026-08-15')).toEqual(['2026-08-15'])
  })

  it('crosses a month boundary', () => {
    expect(datesFrom('2026-08-30', '2026-09-02')).toEqual([
      '2026-08-30',
      '2026-08-31',
      '2026-09-01',
      '2026-09-02',
    ])
  })

  it('returns nothing when the end precedes the start', () => {
    expect(datesFrom('2026-08-15', '2026-08-14')).toEqual([])
  })
})
