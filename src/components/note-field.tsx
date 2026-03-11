'use client'

import React from 'react'

interface NoteFieldProps {
  value: string
  onChange: (value: string) => void
}

export function NoteField({ value, onChange }: NoteFieldProps) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={2}
      maxLength={500}
      className="w-full p-3 rounded-lg border border-warm-300 bg-warm-50 text-warm-700 text-base resize-none placeholder:text-warm-400"
      placeholder="..."
    />
  )
}
