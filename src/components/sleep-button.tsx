'use client'

import React from 'react'
import { formatTime } from '@/lib/dates'
import { groundTouch } from '@/lib/haptics'

interface SleepButtonProps {
  label: string
  timestamp: string | null
  onToggle: () => void
}

export function SleepButton({ label, timestamp, onToggle }: SleepButtonProps) {
  const isRecorded = timestamp !== null

  // Sleep is the anchor met in the dark, half-asleep, often without looking.
  // The tick confirms it landed when the screen can't.
  function handleClick() {
    if (!isRecorded) groundTouch()
    onToggle()
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`
        press-give w-full min-h-[56px] rounded-lg text-base px-4 py-3
        ${
          isRecorded
            ? 'bg-warm-200 text-warm-500'
            : 'bg-warm-50 text-warm-800 border border-warm-300'
        }
      `}
    >
      {isRecorded ? `${label} ${formatTime(timestamp)}` : label}
    </button>
  )
}
