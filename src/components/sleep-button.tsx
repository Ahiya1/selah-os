'use client'

import React from 'react'
import { formatTime } from '@/lib/dates'

interface SleepButtonProps {
  label: string
  timestamp: string | null
  onToggle: () => void
}

export function SleepButton({ label, timestamp, onToggle }: SleepButtonProps) {
  const isRecorded = timestamp !== null

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`
        w-full min-h-[56px] rounded-lg text-base px-4 py-3
        transition-colors
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
