'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getEffectiveDate } from '@/lib/dates'
import type { Database } from '@/lib/types'

type DailyRecord = Database['public']['Tables']['daily_records']['Row']
type DailyRecordInsert = Database['public']['Tables']['daily_records']['Insert']

const DEBOUNCE_MS = 500

const EMPTY_RECORD: Omit<DailyRecord, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
  date: '',
  sleep_start: null,
  sleep_end: null,
  breakfast: false,
  lunch: false,
  dinner: false,
  cipralex_taken: false,
  hygiene_done: false,
  movement_done: false,
  ground_maintenance_done: false,
  ground_build_done: false,
  note: '',
}

export function useDailyRecord(userId: string) {
  const supabase = createClient()
  const effectiveDate = getEffectiveDate()
  const [record, setRecord] = useState<Partial<DailyRecord>>({
    ...EMPTY_RECORD,
    date: effectiveDate,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingUpdates = useRef<Partial<DailyRecordInsert>>({})

  // Fetch on mount
  useEffect(() => {
    async function load() {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('daily_records')
        .select('*')
        .eq('user_id', userId)
        .eq('date', effectiveDate)
        .maybeSingle()

      if (error) {
        setError(error.message)
      } else if (data) {
        setRecord(data)
      }
      setIsLoading(false)
    }

    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- supabase client is stable across renders
  }, [userId, effectiveDate])

  // Flush pending updates to Supabase
  const flush = useCallback(async () => {
    const updates = { ...pendingUpdates.current }
    pendingUpdates.current = {}

    if (Object.keys(updates).length === 0) return

    setError(null)

    const payload: DailyRecordInsert = {
      user_id: userId,
      date: effectiveDate,
      ...updates,
    }

    const { error } = await supabase
      .from('daily_records')
      .upsert(payload, { onConflict: 'user_id,date' })
      .select()
      .single()

    if (error) {
      setError(error.message)
    }
  }, [userId, effectiveDate, supabase])

  // Schedule a debounced save
  const scheduleSave = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    debounceRef.current = setTimeout(() => {
      flush()
    }, DEBOUNCE_MS)
  }, [flush])

  // Update a field optimistically
  const updateField = useCallback(
    (field: keyof DailyRecord, value: DailyRecord[keyof DailyRecord]) => {
      setRecord((prev) => ({ ...prev, [field]: value }))
      pendingUpdates.current[field] = value as never
      scheduleSave()
    },
    [scheduleSave]
  )

  // Record sleep timestamp (flush immediately -- timestamp is time-sensitive)
  const setSleepStart = useCallback(() => {
    const current = record.sleep_start
    const newValue = current ? null : new Date().toISOString()
    setRecord((prev) => ({ ...prev, sleep_start: newValue }))
    pendingUpdates.current.sleep_start = newValue as never
    if (debounceRef.current) clearTimeout(debounceRef.current)
    flush()
  }, [record.sleep_start, flush])

  const setSleepEnd = useCallback(() => {
    const current = record.sleep_end
    const newValue = current ? null : new Date().toISOString()
    setRecord((prev) => ({ ...prev, sleep_end: newValue }))
    pendingUpdates.current.sleep_end = newValue as never
    if (debounceRef.current) clearTimeout(debounceRef.current)
    flush()
  }, [record.sleep_end, flush])

  // Flush on visibility change (app goes to background)
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === 'hidden') {
        if (debounceRef.current) {
          clearTimeout(debounceRef.current)
          debounceRef.current = null
        }
        flush()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [flush])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  return {
    record,
    isLoading,
    error,
    effectiveDate,
    updateField,
    setSleepStart,
    setSleepEnd,
  }
}
