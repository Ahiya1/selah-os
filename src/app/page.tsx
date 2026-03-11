'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useDailyRecord } from '@/hooks/use-daily-record'
import { useActiveProjectName } from '@/hooks/use-active-project-name'
import { DateHeader } from '@/components/date-header'
import { AnchorCheckbox } from '@/components/anchor-checkbox'
import { SleepButton } from '@/components/sleep-button'
import { NoteField } from '@/components/note-field'
import { SectionGroup } from '@/components/section-group'
import type { User } from '@supabase/supabase-js'

export default function TodayPage() {
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

  return <TodayContent userId={user.id} />
}

function TodayContent({ userId }: { userId: string }) {
  const {
    record,
    error,
    updateField,
    setSleepStart,
    setSleepEnd,
  } = useDailyRecord(userId)
  const { projectName } = useActiveProjectName(userId)

  return (
    <div className="max-w-lg mx-auto px-4 pt-5 pb-24 space-y-6">
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
            checked={record.breakfast ?? false}
            onChange={(v) => updateField('breakfast', v)}
          />
          <AnchorCheckbox
            id="lunch"
            label="lunch"
            checked={record.lunch ?? false}
            onChange={(v) => updateField('lunch', v)}
          />
          <AnchorCheckbox
            id="dinner"
            label="dinner"
            checked={record.dinner ?? false}
            onChange={(v) => updateField('dinner', v)}
          />
        </div>
      </SectionGroup>

      <SectionGroup label="medication">
        <div className="flex">
          <AnchorCheckbox
            id="cipralex"
            label="cipralex"
            checked={record.cipralex_taken ?? false}
            onChange={(v) => updateField('cipralex_taken', v)}
          />
        </div>
      </SectionGroup>

      <SectionGroup label="body">
        <div className="flex justify-around">
          <AnchorCheckbox
            id="hygiene"
            label="hygiene"
            checked={record.hygiene_done ?? false}
            onChange={(v) => updateField('hygiene_done', v)}
          />
          <AnchorCheckbox
            id="movement"
            label="movement"
            checked={record.movement_done ?? false}
            onChange={(v) => updateField('movement_done', v)}
          />
        </div>
      </SectionGroup>

      <SectionGroup label="ground">
        {projectName && (
          <p className="text-sm text-warm-600">{projectName}</p>
        )}
        <div className="flex justify-around">
          <AnchorCheckbox
            id="maintenance"
            label="maintenance"
            checked={record.ground_maintenance_done ?? false}
            onChange={(v) => updateField('ground_maintenance_done', v)}
          />
          <AnchorCheckbox
            id="build"
            label="build"
            checked={record.ground_build_done ?? false}
            onChange={(v) => updateField('ground_build_done', v)}
          />
        </div>
      </SectionGroup>

      <SectionGroup label="note">
        <NoteField
          value={record.note ?? ''}
          onChange={(v) => updateField('note', v)}
        />
      </SectionGroup>
    </div>
  )
}
