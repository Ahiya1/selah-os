'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getEffectiveDate, formatDateString } from '@/lib/dates'
import type { Database } from '@/lib/types'

type DailyRecord = Database['public']['Tables']['daily_records']['Row']

export interface DayIntegrity {
  date: string
  sleep: boolean
  food: boolean
  medication: boolean
  body: boolean
  ground: boolean
}

function getLastSevenDates(today?: Date): string[] {
  const effective = getEffectiveDate(today)
  const [year, month, day] = effective.split('-').map(Number)
  const base = new Date(year, month - 1, day)

  const dates: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(base)
    d.setDate(base.getDate() - i)
    dates.push(formatDateString(d))
  }
  return dates
}

function recordToIntegrity(date: string, record: DailyRecord | undefined): DayIntegrity {
  if (!record) {
    return { date, sleep: false, food: false, medication: false, body: false, ground: false }
  }

  return {
    date,
    sleep: !!(record.sleep_start && record.sleep_end),
    food: !!(record.breakfast && record.lunch && record.dinner),
    medication: !!record.cipralex_taken,
    body: !!(record.hygiene_done && record.movement_done),
    ground: !!(record.ground_maintenance_done || record.ground_build_done),
  }
}

export function useGroundIntegrity(userId: string) {
  const supabase = createClient()
  const dates = getLastSevenDates()
  const [days, setDays] = useState<DayIntegrity[]>(
    dates.map((d) => recordToIntegrity(d, undefined))
  )
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      setIsLoading(true)

      const { data, error } = await supabase
        .from('daily_records')
        .select('*')
        .eq('user_id', userId)
        .gte('date', dates[0])
        .lte('date', dates[dates.length - 1]) as unknown as { data: DailyRecord[] | null; error: { message: string } | null }

      if (error) {
        setError(error.message)
        setIsLoading(false)
        return
      }

      const recordsByDate = new Map<string, DailyRecord>()
      if (data) {
        for (const row of data) {
          recordsByDate.set(row.date, row)
        }
      }

      setDays(dates.map((d) => recordToIntegrity(d, recordsByDate.get(d))))
      setIsLoading(false)
    }

    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- supabase client is stable
  }, [userId])

  return { days, isLoading, error }
}

export { getLastSevenDates, recordToIntegrity }
