'use client'

import React, { useState, useEffect } from 'react'
import { getEffectiveDate, formatDisplayDate } from '@/lib/dates'

export function DateHeader() {
  const [dateString, setDateString] = useState<string | null>(null)

  useEffect(() => {
    setDateString(formatDisplayDate(getEffectiveDate()))
  }, [])

  if (!dateString) {
    return <div className="h-8" aria-hidden="true" />
  }

  return <h1 className="text-xl text-warm-800">{dateString}</h1>
}
