'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/', label: 'Today' },
  { href: '/project', label: 'Project' },
  { href: '/signals', label: 'Signals' },
]

export function Nav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-warm-200 pb-[env(safe-area-inset-bottom)]"
      aria-label="Main navigation"
    >
      <div className="flex h-14 max-w-lg mx-auto">
        {NAV_ITEMS.map(({ href, label }) => {
          const isActive = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`
                flex-1 flex items-center justify-center text-base
                ${isActive ? 'text-green-600' : 'text-warm-600'}
              `}
            >
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
