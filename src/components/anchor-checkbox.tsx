'use client'

import React, { useEffect, useRef, useState } from 'react'
import { formatTime } from '@/lib/dates'

type AnchorState = boolean | null

interface AnchorCheckboxProps {
  label: string
  value: AnchorState
  onChange: (value: AnchorState) => void
  /** When the anchor was last marked done. Revealed briefly on completion. */
  timestamp?: string | null
  id: string
}

function nextAnchorState(current: AnchorState): AnchorState {
  if (current === null) return true
  if (current === true) return false
  return null
}

function stateLabel(value: AnchorState): string {
  if (value === null) return 'untouched'
  if (value === true) return 'done'
  return 'not done'
}

const CIRCLE_BASE =
  'w-7 h-7 rounded-full border-2 flex items-center justify-center cursor-pointer transition-[background-color,border-color] duration-700 ease-out'

function circleClass(value: AnchorState): string {
  if (value === true) return `${CIRCLE_BASE} border-green-600 bg-green-600`
  if (value === false) return `${CIRCLE_BASE} border-warm-400 bg-warm-300`
  return `${CIRCLE_BASE} border-warm-400`
}

// How long the time lingers before it fades back to rest (ms).
// Mirrors the time-bloom keyframe duration in globals.css.
const TIME_LINGER_MS = 3200
// How long the beat + tree-ring motion plays (ms).
const BEAT_MS = 1000

export function AnchorCheckbox({ label, value, onChange, timestamp, id }: AnchorCheckboxProps) {
  // `pulse` retriggers the beat + tree-ring; `reveal` blooms the time.
  const [pulse, setPulse] = useState(0)
  const [reveal, setReveal] = useState(false)
  const beatTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const revealTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (beatTimer.current) clearTimeout(beatTimer.current)
      if (revealTimer.current) clearTimeout(revealTimer.current)
    }
  }, [])

  function handleClick() {
    const next = nextAnchorState(value)
    onChange(next)

    if (next === true) {
      // A beat, and a new ring within.
      setPulse((n) => n + 1)
      setReveal(true)
      if (beatTimer.current) clearTimeout(beatTimer.current)
      if (revealTimer.current) clearTimeout(revealTimer.current)
      beatTimer.current = setTimeout(() => setPulse(0), BEAT_MS)
      revealTimer.current = setTimeout(() => setReveal(false), TIME_LINGER_MS)
    } else {
      // Leaving done: no reveal, no ring.
      setReveal(false)
    }
  }

  const isDone = value === true

  return (
    <div className="relative flex flex-col items-center gap-1 select-none min-w-[56px] min-h-[56px] justify-center">
      <div className="relative flex items-center justify-center">
        {/* Tree ring: a single ring etched within, then dissolved. */}
        {pulse > 0 && (
          <span
            key={pulse}
            aria-hidden="true"
            className="anchor-tree-ring absolute w-7 h-7 rounded-full border-2 border-green-600 pointer-events-none"
          />
        )}
        <button
          type="button"
          id={id}
          role="checkbox"
          aria-checked={value === null ? 'mixed' : value}
          aria-label={`${label}: ${stateLabel(value)}`}
          onClick={handleClick}
          className={`${circleClass(value)} ${pulse > 0 ? 'anchor-beat' : ''}`}
        >
          {value === true && (
            <svg
              className="w-4 h-4 text-warm-50"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
          {value === false && (
            <svg
              className="w-4 h-4 text-warm-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12h12" />
            </svg>
          )}
        </button>
      </div>
      <span className="text-sm text-warm-600">{label}</span>
      {/* The moment it was met — blooms in, rests, fades back to ground. */}
      {reveal && isDone && timestamp && (
        <span
          key={`${pulse}-time`}
          aria-hidden="true"
          className="anchor-time absolute top-full mt-0.5 text-xs tabular-nums text-warm-500 pointer-events-none"
        >
          {formatTime(timestamp)}
        </span>
      )}
    </div>
  )
}
