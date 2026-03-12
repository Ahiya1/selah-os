import React from 'react'
import type { DayIntegrity } from '@/hooks/use-ground-integrity'

const ANCHORS = ['sleep', 'food', 'medication', 'body', 'ground'] as const

interface IntegrityGridProps {
  days: DayIntegrity[]
}

function formatDayLabel(dateString: string): string {
  const [year, month, day] = dateString.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString(undefined, { weekday: 'narrow' })
}

export function IntegrityGrid({ days }: IntegrityGridProps) {
  return (
    <div className="space-y-4" role="table" aria-label="Ground integrity">
      {/* Day labels */}
      <div className="grid grid-cols-[80px_repeat(7,1fr)] gap-1 items-center">
        <span />
        {days.map((day) => (
          <span
            key={day.date}
            className="text-center text-xs text-warm-500"
          >
            {formatDayLabel(day.date)}
          </span>
        ))}
      </div>

      {/* Anchor rows */}
      {ANCHORS.map((anchor) => (
        <div
          key={anchor}
          className="grid grid-cols-[80px_repeat(7,1fr)] gap-1 items-center"
          role="row"
        >
          <span className="text-sm text-warm-600">{anchor}</span>
          {days.map((day) => {
            const filled = day[anchor]
            return (
              <div key={day.date} className="flex justify-center" role="cell">
                <span
                  className={`w-3.5 h-3.5 rounded-full ${
                    filled ? 'bg-green-600' : 'bg-warm-300'
                  }`}
                  aria-label={`${anchor} ${day.date}: ${filled ? 'done' : 'not done'}`}
                />
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
