'use client'

import { useRef, useCallback, useEffect } from 'react'

/**
 * Generic debounced save hook.
 * Takes a save function and delay, returns a trigger function that debounces calls.
 * Flushes pending save on unmount and visibility change.
 */
export function useDebouncedSave(
  saveFn: () => Promise<void>,
  delay: number = 500
) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const saveFnRef = useRef(saveFn)

  // Keep the save function reference current
  saveFnRef.current = saveFn

  const flush = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    saveFnRef.current()
  }, [])

  const schedule = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    timeoutRef.current = setTimeout(() => {
      saveFnRef.current()
      timeoutRef.current = null
    }, delay)
  }, [delay])

  // Flush on visibility change (app goes to background)
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === 'hidden' && timeoutRef.current) {
        flush()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [flush])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return { schedule, flush }
}
