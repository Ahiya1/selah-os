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
  breakfast: null,
  lunch: null,
  dinner: null,
  cipralex_taken: null,
  hygiene_done: null,
  movement_done: null,
  ground_maintenance_done: null,
  ground_build_done: null,
  rest_done: null,
  breakfast_at: null,
  lunch_at: null,
  dinner_at: null,
  cipralex_taken_at: null,
  hygiene_done_at: null,
  movement_done_at: null,
  ground_maintenance_done_at: null,
  ground_build_done_at: null,
  rest_done_at: null,
  note: '',
}

// Each anchor's boolean column maps to a timestamp companion (<column>_at).
// The timestamp records the moment the anchor was met.
type AnchorField =
  | 'breakfast'
  | 'lunch'
  | 'dinner'
  | 'cipralex_taken'
  | 'hygiene_done'
  | 'movement_done'
  | 'ground_maintenance_done'
  | 'ground_build_done'
  | 'rest_done'

const ANCHOR_TIME_FIELD: Record<AnchorField, keyof DailyRecord> = {
  breakfast: 'breakfast_at',
  lunch: 'lunch_at',
  dinner: 'dinner_at',
  cipralex_taken: 'cipralex_taken_at',
  hygiene_done: 'hygiene_done_at',
  movement_done: 'movement_done_at',
  ground_maintenance_done: 'ground_maintenance_done_at',
  ground_build_done: 'ground_build_done_at',
  rest_done: 'rest_done_at',
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

  // Set an anchor and stamp the moment it was met.
  // When marked done (true), capture NOW(); otherwise clear the timestamp.
  // The boolean and its timestamp are written together so they never drift.
  const setAnchor = useCallback(
    (field: AnchorField, value: boolean | null) => {
      const timeField = ANCHOR_TIME_FIELD[field]
      const timestamp = value === true ? new Date().toISOString() : null
      setRecord((prev) => ({ ...prev, [field]: value, [timeField]: timestamp }))
      pendingUpdates.current[field] = value as never
      pendingUpdates.current[timeField] = timestamp as never
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
    setAnchor,
    setSleepStart,
    setSleepEnd,
  }
}
