'use client'

import React from 'react'

interface AnchorCheckboxProps {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  id: string
}

export function AnchorCheckbox({ label, checked, onChange, id }: AnchorCheckboxProps) {
  return (
    <label
      htmlFor={id}
      className="flex flex-col items-center gap-1 cursor-pointer select-none min-w-[56px] min-h-[56px] justify-center"
    >
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only peer"
      />
      <span
        className="w-7 h-7 rounded-full border-2 border-warm-400 peer-checked:bg-green-600 peer-checked:border-green-600 transition-colors flex items-center justify-center"
        aria-hidden="true"
      >
        {checked && (
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
      </span>
      <span className="text-sm text-warm-600">{label}</span>
    </label>
  )
}
