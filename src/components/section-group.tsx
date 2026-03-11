import React from 'react'

interface SectionGroupProps {
  label: string
  children: React.ReactNode
}

export function SectionGroup({ label, children }: SectionGroupProps) {
  return (
    <section className="space-y-2">
      <h2 className="text-sm text-warm-500 uppercase tracking-wide">{label}</h2>
      {children}
    </section>
  )
}
