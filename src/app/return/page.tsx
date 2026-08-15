'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useJourney } from '@/hooks/use-journey'
import { Journey } from '@/components/journey'
import { isReturnOpen } from '@/lib/return-window'
import { formatShortDate } from '@/lib/dates'
import type { User } from '@supabase/supabase-js'

export default function ReturnPage() {
  const [user, setUser] = useState<User | null>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })
  }, [supabase.auth])

  if (!user) {
    return <div className="min-h-dvh" />
  }

  return <ReturnContent userId={user.id} />
}

function ReturnContent({ userId }: { userId: string }) {
  // Read once, on open. The window does not need to be watched: nothing about
  // this screen should be waited for while you are standing on it.
  const [open] = useState(() => isReturnOpen())

  if (!open) return <ClosedGround />

  return <OpenJourney userId={userId} />
}

/**
 * Between windows: the ground, and nothing standing on it.
 *
 * No countdown and no explanation. A countdown would turn the wait into
 * something to check, which is the whole thing this is built to avoid.
 */
function ClosedGround() {
  return (
    <div className="ground-arrive max-w-lg mx-auto px-4 min-h-dvh flex items-end pb-24">
      <div className="w-full border-b border-warm-400/60" />
    </div>
  )
}

function OpenJourney({ userId }: { userId: string }) {
  const { days, error } = useJourney(userId)

  return (
    <div className="ground-arrive max-w-lg mx-auto px-4 pt-5 pb-8">
      <h1 className="text-sm text-warm-600 uppercase tracking-wide mb-6">return</h1>

      {error && (
        <p className="text-error text-sm" role="alert">{error}</p>
      )}

      <Journey days={days} />

      {days.length > 0 && (
        <div className="flex justify-between mt-2 text-xs text-warm-500">
          <span>{formatShortDate(days[0].date)}</span>
          <span>{formatShortDate(days[days.length - 1].date)}</span>
        </div>
      )}
    </div>
  )
}
