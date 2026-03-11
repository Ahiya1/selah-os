'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getWeekStart } from '@/lib/dates'
import type { Database } from '@/lib/types'

type WeeklySignal = Database['public']['Tables']['weekly_signals']['Row']

const EMPTY_SIGNAL = {
  financial_note: '',
  sleep_state: '',
  note: '',
}

export function useWeeklySignals(userId: string) {
  const supabase = createClient()
  const weekStart = getWeekStart()
  const [currentSignal, setCurrentSignal] = useState<Partial<WeeklySignal>>({
    ...EMPTY_SIGNAL,
    week_start: weekStart,
  })
  const [recentSignals, setRecentSignals] = useState<WeeklySignal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch current week signal + recent history on mount
  useEffect(() => {
    async function load() {
      setIsLoading(true)

      // Fetch current week
      const { data: current, error: currentError } = await supabase
        .from('weekly_signals')
        .select('*')
        .eq('user_id', userId)
        .eq('week_start', weekStart)
        .maybeSingle()

      if (currentError) {
        setError(currentError.message)
        setIsLoading(false)
        return
      }

      if (current) {
        setCurrentSignal(current)
      }

      // Fetch recent signals (last 4 weeks, excluding current)
      const { data: recent, error: recentError } = await supabase
        .from('weekly_signals')
        .select('*')
        .eq('user_id', userId)
        .neq('week_start', weekStart)
        .order('week_start', { ascending: false })
        .limit(4)

      if (recentError) {
        setError(recentError.message)
      } else if (recent) {
        setRecentSignals(recent as WeeklySignal[])
      }

      setIsLoading(false)
    }

    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, weekStart])

  // Update a field in the current signal (local state only, no save)
  const updateField = useCallback(
    (field: 'financial_note' | 'sleep_state' | 'note', value: string) => {
      setCurrentSignal(prev => ({ ...prev, [field]: value }))
    },
    []
  )

  // Explicit save (upsert current week's signal)
  const save = useCallback(async () => {
    setIsSaving(true)
    setError(null)

    const { data, error } = await supabase
      .from('weekly_signals')
      .upsert(
        {
          user_id: userId,
          week_start: weekStart,
          financial_note: currentSignal.financial_note ?? '',
          sleep_state: currentSignal.sleep_state ?? '',
          note: currentSignal.note ?? '',
        },
        { onConflict: 'user_id,week_start' }
      )
      .select()
      .single()

    if (error) {
      setError(error.message)
    } else if (data) {
      setCurrentSignal(data)
    }

    setIsSaving(false)
  }, [userId, weekStart, currentSignal, supabase])

  return {
    currentSignal,
    recentSignals,
    weekStart,
    isLoading,
    isSaving,
    error,
    updateField,
    save,
  }
}
