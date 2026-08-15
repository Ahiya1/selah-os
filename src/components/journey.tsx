import React from 'react'
import { ANCHOR_COUNT, type JourneyDay } from '@/hooks/use-journey'

interface JourneyProps {
  days: JourneyDay[]
}

/**
 * The journey as terrain.
 *
 * Each day is a point on a ridgeline, as high as the ground it held. Filled
 * solid down to the earth — mass, not a line floating in space. No axis, no
 * ticks, no labels, nothing to read a number off. You see a shape.
 *
 * The viewBox is one unit per day, stretched to whatever width it is given,
 * so the whole span always fits and no aggregation is ever needed. Twenty
 * days look like a few standing trees; a thousand look like a far treeline.
 * It only ever grows wider and slower, which is its own protection: after a
 * year, a fortnight barely moves it.
 */
/**
 * How wide a view to take of each day.
 *
 * Drawn raw, a long journey turns to static: at a pixel a day, ordinary
 * variation reads as noise rather than landscape, and the movement worth
 * seeing disappears inside it. So the span is always read at roughly the same
 * grain — about fifty features across, however long it has grown. A fortnight
 * is read day by day; a year is read in weeks.
 *
 * This is how distance works on real terrain. You don't see the single trees
 * in a far treeline, and their absence is not what makes it a forest.
 */
export function ridgeWindow(count: number): number {
  return Math.max(1, Math.round(count / 50))
}

/** A centred mean, narrowing at the ends where there is less to see with. */
export function smoothHeights(days: JourneyDay[], window: number): number[] {
  if (window <= 1) return days.map((d) => d.held)

  const half = Math.floor(window / 2)
  return days.map((_, i) => {
    const lo = Math.max(0, i - half)
    const hi = Math.min(days.length - 1, i + half)
    let sum = 0
    for (let j = lo; j <= hi; j++) sum += days[j].held
    return sum / (hi - lo + 1)
  })
}

const fmt = (n: number) => Number(n.toFixed(3)).toString()

export function buildRidgePath(days: JourneyDay[]): string {
  if (days.length === 0) return ''

  const floor = ANCHOR_COUNT
  const heights = smoothHeights(days, ridgeWindow(days.length))
  const peaks = heights.map((held, i) => `${i},${fmt(floor - held)}`)
  const last = heights[heights.length - 1]

  return [
    `M ${peaks[0]}`,
    ...peaks.slice(1).map((p) => `L ${p}`),
    `L ${days.length},${fmt(floor - last)}`,
    `L ${days.length},${floor}`,
    `L 0,${floor}`,
    'Z',
  ].join(' ')
}

export function Journey({ days }: JourneyProps) {
  return (
    <div className="w-full h-56 border-b border-warm-400/60">
      {days.length > 0 && (
        <svg
          className="w-full h-full"
          viewBox={`0 0 ${days.length} ${ANCHOR_COUNT}`}
          preserveAspectRatio="none"
          role="img"
          aria-label={`The journey, ${days.length} days`}
        >
          <path d={buildRidgePath(days)} fill="var(--color-green-700)" />
        </svg>
      )}
    </div>
  )
}
