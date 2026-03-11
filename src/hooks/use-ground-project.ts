'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/types'

type GroundProject = Database['public']['Tables']['ground_projects']['Row']

export function useGroundProject(userId: string) {
  const supabase = createClient()
  const [project, setProject] = useState<GroundProject | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch active project on mount
  useEffect(() => {
    async function load() {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('ground_projects')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle()

      if (error) {
        setError(error.message)
      } else {
        setProject(data as GroundProject | null)
      }
      setIsLoading(false)
    }

    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  // Update project name (immediate save, not debounced)
  const updateName = useCallback(async (name: string) => {
    if (!project || !name.trim()) return
    setError(null)

    // Optimistic update
    setProject(prev => prev ? { ...prev, name } : null)

    const { data, error } = await supabase
      .from('ground_projects')
      .update({ name })
      .eq('id', project.id)
      .select()
      .single()

    if (error) {
      setError(error.message)
      // Revert optimistic update
      setProject(prev => prev ? { ...prev, name: project.name } : null)
    } else if (data) {
      setProject(data as GroundProject)
    }
  }, [project, supabase])

  // Toggle status between active and paused (immediate save)
  const toggleStatus = useCallback(async () => {
    if (!project) return
    setError(null)

    const newStatus = project.status === 'active' ? 'paused' : 'active'

    // Optimistic update
    setProject(prev => prev ? { ...prev, status: newStatus } : null)

    const { data, error } = await supabase
      .from('ground_projects')
      .update({ status: newStatus })
      .eq('id', project.id)
      .select()
      .single()

    if (error) {
      setError(error.message)
      // Revert
      setProject(prev => prev ? { ...prev, status: project.status } : null)
    } else if (data) {
      setProject(data as GroundProject)
    }
  }, [project, supabase])

  // Create new project (deactivates current active project first)
  const createProject = useCallback(async (name: string) => {
    if (!name.trim()) return
    setError(null)

    const previousProject = project

    // Step 1: Deactivate current active project
    if (previousProject) {
      const { error: deactivateError } = await supabase
        .from('ground_projects')
        .update({ status: 'completed' })
        .eq('id', previousProject.id)

      if (deactivateError) {
        setError(deactivateError.message)
        return
      }
    }

    // Step 2: Insert new project
    const { data, error } = await supabase
      .from('ground_projects')
      .insert({ user_id: userId, name, status: 'active' })
      .select()
      .single()

    if (error) {
      setError(error.message)
      // Re-activate previous project if insert failed
      if (previousProject) {
        await supabase
          .from('ground_projects')
          .update({ status: 'active' })
          .eq('id', previousProject.id)
        setProject(previousProject)
      }
    } else if (data) {
      setProject(data as GroundProject)
    }
  }, [project, userId, supabase])

  return { project, isLoading, error, updateName, toggleStatus, createProject }
}
