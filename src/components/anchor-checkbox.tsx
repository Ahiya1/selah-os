'use client'

import React from 'react'

type AnchorState = boolean | null

interface AnchorCheckboxProps {
  label: string
  value: AnchorState
  onChange: (value: AnchorState) => void
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

const CIRCLE_BASE = 'w-7 h-7 rounded-full border-2 transition-colors flex items-center justify-center cursor-pointer'

function circleClass(value: AnchorState): string {
  if (value === true) return `${CIRCLE_BASE} border-green-600 bg-green-600`
  if (value === false) return `${CIRCLE_BASE} border-warm-400 bg-warm-300`
  return `${CIRCLE_BASE} border-warm-400`
}

export function AnchorCheckbox({ label, value, onChange, id }: AnchorCheckboxProps) {
  return (
    <div className="flex flex-col items-center gap-1 select-none min-w-[56px] min-h-[56px] justify-center">
      <button
        type="button"
        id={id}
        role="checkbox"
        aria-checked={value === null ? 'mixed' : value}
        aria-label={`${label}: ${stateLabel(value)}`}
        onClick={() => onChange(nextAnchorState(value))}
        className={circleClass(value)}
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
      <span className="text-sm text-warm-600">{label}</span>
    </div>
  )
}
