import { getEffectiveDate, getDayOfWeek, formatDateString } from '@/lib/dates'
import { DAY_BOUNDARY_HOUR } from '@/lib/constants'

/**
 * When the journey is visible.
 *
 * Motzash, every second week. The threshold already exists in the week — the
 * app borrows it rather than inventing a ceremony of its own. Nothing
 * announces the window and nothing counts down to it; if a Motzash passes
 * unopened, the next one comes and nothing is said about the one that didn't.
 *
 * Deliberately no zmanim lookup. A network dependency for nightfall would rot
 * long before this app does, and an hour is close enough year-round.
 */

/** The Motzash the cycle counts from. */
export const CYCLE_ANCHOR = '2026-08-15'

/** Roughly nightfall — late enough that Shabbat has gone out. */
export const RETURN_HOUR = 20

const MS_PER_DAY = 86_400_000

function parseLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day)
}

/**
 * Whole days between two YYYY-MM-DD strings. Rounded, so the hour shifts that
 * come with daylight saving never accumulate into an off-by-one week.
 */
export function daysBetween(from: string, to: string): number {
  const diff = parseLocalDate(to).getTime() - parseLocalDate(from).getTime()
  return Math.round(diff / MS_PER_DAY)
}

/**
 * True during the tail of every second Saturday, from nightfall through the
 * 4:00 boundary — which is one continuous stretch, since the effective date
 * stays on Saturday until then.
 */
export function isReturnOpen(now?: Date): boolean {
  const current = now ?? new Date()
  const effective = getEffectiveDate(current)

  if (getDayOfWeek(effective) !== 6) return false

  const hour = current.getHours()
  const isNight = hour >= RETURN_HOUR || hour < DAY_BOUNDARY_HOUR
  if (!isNight) return false

  // Both dates are Saturdays, so the gap is always a whole number of weeks.
  const weeks = daysBetween(CYCLE_ANCHOR, effective) / 7
  return Number.isInteger(weeks) && weeks % 2 === 0
}

/** The full run of dates from the first record to today, with no gaps. */
export function datesFrom(start: string, end: string): string[] {
  const span = daysBetween(start, end)
  if (span < 0) return []

  const base = parseLocalDate(start)
  const dates: string[] = []
  for (let i = 0; i <= span; i++) {
    const d = new Date(base)
    d.setDate(base.getDate() + i)
    dates.push(formatDateString(d))
  }
  return dates
}
