'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useGroundIntegrity } from '@/hooks/use-ground-integrity'
import { IntegrityGrid } from '@/components/integrity-grid'
import type { User } from '@supabase/supabase-js'

export default function GroundPage() {
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

  return <GroundContent userId={user.id} />
}

function GroundContent({ userId }: { userId: string }) {
  const { days, error } = useGroundIntegrity(userId)

  return (
    <div className="max-w-lg mx-auto px-4 pt-5 pb-24">
      <h1 className="text-sm text-warm-600 uppercase tracking-wide mb-6">7 days</h1>

      {error && (
        <p className="text-error text-sm" role="alert">{error}</p>
      )}

      <IntegrityGrid days={days} />
    </div>
  )
}
