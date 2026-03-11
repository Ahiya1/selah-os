'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useGroundProject } from '@/hooks/use-ground-project'
import { SectionGroup } from '@/components/section-group'
import type { User } from '@supabase/supabase-js'

export default function ProjectPage() {
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

  return <ProjectContent userId={user.id} />
}

function formatStartDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const MONTHS = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ]
  return `since ${MONTHS[month - 1]} ${day}, ${year}`
}

function ProjectContent({ userId }: { userId: string }) {
  const { project, isLoading, error, updateName, toggleStatus, createProject } =
    useGroundProject(userId)
  const [isCreating, setIsCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState('')

  if (isLoading) {
    return <div className="max-w-lg mx-auto px-4 pt-5 pb-24"><div className="h-8" /></div>
  }

  const handleSaveName = async () => {
    if (nameValue.trim() && nameValue !== project?.name) {
      await updateName(nameValue.trim())
    }
    setEditingName(false)
  }

  const handleCreate = async () => {
    if (newName.trim()) {
      await createProject(newName.trim())
      setNewName('')
      setIsCreating(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-5 pb-24 space-y-6">
      <h1 className="text-xl text-warm-800">ground project</h1>

      {error && (
        <p className="text-error text-sm" role="alert">{error}</p>
      )}

      {project ? (
        <SectionGroup label="active project">
          <div className="space-y-3">
            {editingName ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  className="flex-1 p-3 rounded-lg border border-warm-300 bg-warm-50 text-warm-700 text-base placeholder:text-warm-400"
                  placeholder="project name"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleSaveName}
                  className="px-4 py-2 text-sm text-green-600"
                >
                  save
                </button>
                <button
                  type="button"
                  onClick={() => setEditingName(false)}
                  className="px-4 py-2 text-sm text-warm-600"
                >
                  cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setNameValue(project.name)
                  setEditingName(true)
                }}
                className="text-left text-lg text-warm-800"
              >
                {project.name}
              </button>
            )}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={toggleStatus}
                className={`text-sm ${project.status === 'active' ? 'text-green-600' : 'text-warm-500'}`}
              >
                {project.status}
              </button>
              <span className="text-sm text-warm-600">
                {formatStartDate(project.start_date)}
              </span>
            </div>
          </div>
        </SectionGroup>
      ) : (
        <div className="space-y-3">
          <p className="text-warm-600 text-sm">no active project</p>
        </div>
      )}

      {isCreating ? (
        <div className="space-y-3">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="w-full p-3 rounded-lg border border-warm-300 bg-warm-50 text-warm-700 text-base placeholder:text-warm-400"
            placeholder="new project name"
            autoFocus
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCreate}
              className="px-4 py-2 text-sm text-green-600"
            >
              create
            </button>
            <button
              type="button"
              onClick={() => {
                setIsCreating(false)
                setNewName('')
              }}
              className="px-4 py-2 text-sm text-warm-600"
            >
              cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsCreating(true)}
          className="text-sm text-warm-600"
        >
          + new project
        </button>
      )}
    </div>
  )
}
