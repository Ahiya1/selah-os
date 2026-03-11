'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useActiveProjectName(userId: string) {
  const supabase = createClient()
  const [projectName, setProjectName] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setIsLoading(true)
      const { data } = await supabase
        .from('ground_projects')
        .select('name')
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle()

      setProjectName(data?.name ?? null)
      setIsLoading(false)
    }

    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  return { projectName, isLoading }
}
