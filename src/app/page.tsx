'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useDailyRecord } from '@/hooks/use-daily-record'
import { DateHeader } from '@/components/date-header'
import { AnchorCheckbox } from '@/components/anchor-checkbox'
import { SleepButton } from '@/components/sleep-button'
import { NoteField } from '@/components/note-field'
import { SectionGroup } from '@/components/section-group'
import { getDayOfWeek } from '@/lib/dates'
import type { User } from '@supabase/supabase-js'

export default function TodayPage() {
  const [user, setUser] = useState<User | null>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })
  }, [supabase.auth])

  // The ground field is already painted by the body. Nothing is shown here,
  // so the screen is somewhere before you arrive rather than an empty white
  // room that gets furnished while you watch.
  if (!user) {
    return <div className="min-h-dvh" />
  }

  return <TodayContent userId={user.id} />
}

function TodayContent({ userId }: { userId: string }) {
  const {
    record,
    error,
    effectiveDate,
    updateField,
    setAnchor,
    setSleepStart,
    setSleepEnd,
  } = useDailyRecord(userId)

  // Ground rhythm varies across the week:
  //   Sun-Thu: maintenance + build
  //   Fri:     maintenance only
  //   Sat:     rest (a distinct practice, no maintenance or build)
  const dayOfWeek = getDayOfWeek(effectiveDate)
  const isFriday = dayOfWeek === 5
  const isSaturday = dayOfWeek === 6

  return (
    <div className="ground-arrive max-w-lg mx-auto px-4 pt-5 pb-8 space-y-6">
      <DateHeader />

      {error && (
        <p className="text-error text-sm" role="alert">{error}</p>
      )}

      <SectionGroup label="sleep">
        <div className="space-y-2">
          <SleepButton
            label="going to sleep"
            timestamp={record.sleep_start ?? null}
            onToggle={setSleepStart}
          />
          <SleepButton
            label="woke up"
            timestamp={record.sleep_end ?? null}
            onToggle={setSleepEnd}
          />
        </div>
      </SectionGroup>

      <SectionGroup label="food">
        <div className="flex justify-around">
          <AnchorCheckbox
            id="breakfast"
            label="breakfast"
            value={record.breakfast ?? null}
            timestamp={record.breakfast_at ?? null}
            onChange={(v) => setAnchor('breakfast', v)}
          />
          <AnchorCheckbox
            id="lunch"
            label="lunch"
            value={record.lunch ?? null}
            timestamp={record.lunch_at ?? null}
            onChange={(v) => setAnchor('lunch', v)}
          />
          <AnchorCheckbox
            id="dinner"
            label="dinner"
            value={record.dinner ?? null}
            timestamp={record.dinner_at ?? null}
            onChange={(v) => setAnchor('dinner', v)}
          />
        </div>
      </SectionGroup>

      <SectionGroup label="medication">
        <div className="flex">
          <AnchorCheckbox
            id="cipralex"
            label="cipralex"
            value={record.cipralex_taken ?? null}
            timestamp={record.cipralex_taken_at ?? null}
            onChange={(v) => setAnchor('cipralex_taken', v)}
          />
        </div>
      </SectionGroup>

      <SectionGroup label="body">
        <div className="flex justify-around">
          <AnchorCheckbox
            id="hygiene"
            label="hygiene"
            value={record.hygiene_done ?? null}
            timestamp={record.hygiene_done_at ?? null}
            onChange={(v) => setAnchor('hygiene_done', v)}
          />
          <AnchorCheckbox
            id="movement"
            label="movement"
            value={record.movement_done ?? null}
            timestamp={record.movement_done_at ?? null}
            onChange={(v) => setAnchor('movement_done', v)}
          />
        </div>
      </SectionGroup>

      {isSaturday ? (
        <SectionGroup label="rest">
          <div className="flex">
            <AnchorCheckbox
              id="rest"
              label="rest"
              value={record.rest_done ?? null}
              timestamp={record.rest_done_at ?? null}
              onChange={(v) => setAnchor('rest_done', v)}
            />
          </div>
        </SectionGroup>
      ) : (
        <SectionGroup label="ground">
          <div className="flex justify-around">
            <AnchorCheckbox
              id="maintenance"
              label="maintenance"
              value={record.ground_maintenance_done ?? null}
              timestamp={record.ground_maintenance_done_at ?? null}
              onChange={(v) => setAnchor('ground_maintenance_done', v)}
            />
            {!isFriday && (
              <AnchorCheckbox
                id="build"
                label="build"
                value={record.ground_build_done ?? null}
                timestamp={record.ground_build_done_at ?? null}
                onChange={(v) => setAnchor('ground_build_done', v)}
              />
            )}
          </div>
        </SectionGroup>
      )}

      <SectionGroup label="note">
        <NoteField
          value={record.note ?? ''}
          onChange={(v) => updateField('note', v)}
        />
      </SectionGroup>
    </div>
  )
}
