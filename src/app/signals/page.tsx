'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useWeeklySignals } from '@/hooks/use-weekly-signals'
import { formatWeekRange } from '@/lib/dates'
import { SectionGroup } from '@/components/section-group'
import { NoteField } from '@/components/note-field'
import type { User } from '@supabase/supabase-js'

export default function SignalsPage() {
  const [user, setUser] = useState<User | null>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })
  }, [supabase.auth])

  if (!user) {
    return <div className="p-4" />
  }

  return <SignalsContent userId={user.id} />
}

function SignalsContent({ userId }: { userId: string }) {
  const {
    currentSignal,
    recentSignals,
    weekStart,
    isLoading,
    isSaving,
    error,
    updateField,
    save,
  } = useWeeklySignals(userId)

  if (isLoading) {
    return <div className="max-w-lg mx-auto px-4 pt-5 pb-24"><div className="h-8" /></div>
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-5 pb-24 space-y-6">
      <h1 className="text-xl text-warm-800">{formatWeekRange(weekStart)}</h1>

      {error && (
        <p className="text-error text-sm" role="alert">{error}</p>
      )}

      <SectionGroup label="financial">
        <NoteField
          value={currentSignal.financial_note ?? ''}
          onChange={(v) => updateField('financial_note', v)}
        />
      </SectionGroup>

      <SectionGroup label="sleep">
        <NoteField
          value={currentSignal.sleep_state ?? ''}
          onChange={(v) => updateField('sleep_state', v)}
        />
      </SectionGroup>

      <SectionGroup label="note">
        <NoteField
          value={currentSignal.note ?? ''}
          onChange={(v) => updateField('note', v)}
        />
      </SectionGroup>

      <button
        type="button"
        onClick={save}
        disabled={isSaving}
        className="w-full p-3 rounded-lg bg-green-600 text-warm-50 text-base disabled:opacity-50"
      >
        {isSaving ? 'saving...' : 'save'}
      </button>

      {recentSignals.length > 0 && (
        <div className="pt-4 border-t border-warm-300 space-y-4">
          <h2 className="text-sm text-warm-600 uppercase tracking-wide">recent weeks</h2>
          {recentSignals.map((signal) => (
            <div key={signal.id} className="space-y-1">
              <p className="text-sm text-warm-600">{formatWeekRange(signal.week_start)}</p>
              {signal.financial_note && (
                <p className="text-sm text-warm-700 truncate">{signal.financial_note}</p>
              )}
              {signal.sleep_state && (
                <p className="text-sm text-warm-700 truncate">{signal.sleep_state}</p>
              )}
              {signal.note && (
                <p className="text-sm text-warm-700 truncate">{signal.note}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
