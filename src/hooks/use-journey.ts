'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getEffectiveDate } from '@/lib/dates'
import { datesFrom } from '@/lib/return-window'
import { recordToIntegrity } from '@/hooks/use-ground-integrity'
import type { Database } from '@/lib/types'

type DailyRecord = Database['public']['Tables']['daily_records']['Row']

export interface JourneyDay {
  date: string
  /** How much of the ground was held that day, 0 through 5. */
  held: number
}

/** The most ground a single day can hold: sleep, food, medication, body, ground. */
export const ANCHOR_COUNT = 5

export function toJourneyDay(date: string, record: DailyRecord | undefined): JourneyDay {
  // recordToIntegrity already knows the week's rhythm — that Saturday holds
  // its ground by resting and Friday by maintaining alone.
  const integrity = recordToIntegrity(date, record)
  const held = [
    integrity.sleep,
    integrity.food,
    integrity.medication,
    integrity.body,
    integrity.ground,
  ].filter(Boolean).length

  return { date, held }
}

/**
 * The whole journey: every day from the first record to today, days never
 * touched included as the low ground they were.
 */
export function useJourney(userId: string) {
  const [days, setDays] = useState<JourneyDay[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()

    async function load() {
      setIsLoading(true)

      const { data, error } = (await supabase
        .from('daily_records')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: true })) as unknown as {
        data: DailyRecord[] | null
        error: { message: string } | null
      }

      if (error) {
        setError(error.message)
        setIsLoading(false)
        return
      }

      if (!data || data.length === 0) {
        setDays([])
        setIsLoading(false)
        return
      }

      const byDate = new Map<string, DailyRecord>()
      for (const row of data) byDate.set(row.date, row)

      const span = datesFrom(data[0].date, getEffectiveDate())
      setDays(span.map((d) => toJourneyDay(d, byDate.get(d))))
      setIsLoading(false)
    }

    load()
  }, [userId])

  return { days, isLoading, error }
}
