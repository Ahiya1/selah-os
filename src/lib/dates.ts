import { DAY_BOUNDARY_HOUR } from '@/lib/constants'

/**
 * Returns the "effective date" as YYYY-MM-DD string.
 * Before 4:00 AM local time, returns yesterday's date.
 * At or after 4:00 AM, returns today's date.
 */
export function getEffectiveDate(now?: Date): string {
  const current = now ?? new Date()
  const adjusted = new Date(current)

  if (current.getHours() < DAY_BOUNDARY_HOUR) {
    adjusted.setDate(adjusted.getDate() - 1)
  }

  return formatDateString(adjusted)
}

/**
 * Formats a Date object as YYYY-MM-DD in local timezone.
 * Avoids .toISOString().slice(0,10) which converts to UTC.
 */
export function formatDateString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Formats a YYYY-MM-DD date string for display.
 * Example: "2026-03-12" -> "Thursday, March 12"
 */
export function formatDisplayDate(dateString: string): string {
  const [year, month, day] = dateString.split('-').map(Number)
  const date = new Date(year, month - 1, day)

  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Formats an ISO timestamp for time display.
 * Example: "2026-03-12T07:14:00.000Z" -> "07:14"
 */
export function formatTime(isoTimestamp: string): string {
  const date = new Date(isoTimestamp)
  return date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

/**
 * Returns the Monday of the current week as YYYY-MM-DD.
 * Used for weekly_signals.week_start (Iteration 2).
 */
export function getWeekStart(now?: Date): string {
  const current = now ?? new Date()
  const day = current.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(current)
  monday.setDate(current.getDate() + diff)
  return formatDateString(monday)
}

/**
 * Formats a week start date (YYYY-MM-DD Monday) as a display range.
 * Example: "2026-03-09" -> "Mar 9 \u2013 15"
 * Handles month boundaries: "2026-03-30" -> "Mar 30 \u2013 Apr 5"
 */
const MONTH_ABBREVS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

export function formatWeekRange(weekStart: string): string {
  const [year, month, day] = weekStart.split('-').map(Number)
  const monday = new Date(year, month - 1, day)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)

  const startMonth = MONTH_ABBREVS[monday.getMonth()]
  const endMonth = MONTH_ABBREVS[sunday.getMonth()]

  if (startMonth === endMonth) {
    return `${startMonth} ${monday.getDate()} \u2013 ${sunday.getDate()}`
  }

  return `${startMonth} ${monday.getDate()} \u2013 ${endMonth} ${sunday.getDate()}`
}
