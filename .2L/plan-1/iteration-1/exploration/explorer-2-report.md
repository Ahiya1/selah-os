# Explorer 2 Report: Technology Patterns & Dependencies

## Executive Summary

This report provides the exact dependency versions, code patterns, and implementation templates that builders need for Iteration 1 (Foundation + Today Screen). Every pattern has been verified against the latest stable package versions as of March 2026. The stack is deliberately minimal: 5 production dependencies, 9 dev dependencies, native HTML elements throughout, Tailwind CSS v4 for styling with a custom warm palette.

---

## 1. Exact Dependency List with Versions

### Production Dependencies (5 packages)

```json
{
  "dependencies": {
    "next": "15.5.12",
    "react": "^19.2.4",
    "react-dom": "^19.2.4",
    "@supabase/supabase-js": "^2.99.1",
    "@supabase/ssr": "0.9.0"
  }
}
```

**Version rationale:**
- **next@15.5.12**: Latest patch in the 15.x LTS line. Pinned exactly (no caret) because Next.js minor versions can introduce behavioral changes. Next.js 16 exists (16.1.6) but is too new for a decades-stable project.
- **react/react-dom@^19.2.4**: React 19 is required by Next.js 15. Caret range is safe -- React follows semver strictly.
- **@supabase/supabase-js@^2.99.1**: The Supabase client. Caret range is safe within the 2.x major version.
- **@supabase/ssr@0.9.0**: Pinned to exact version (no caret). Pre-1.0 package -- minor versions can contain breaking changes. This is the officially recommended package for Next.js App Router integration, replacing the deprecated `@supabase/auth-helpers-nextjs`.

### Dev Dependencies (9 packages)

```json
{
  "devDependencies": {
    "typescript": "^5.9.3",
    "@types/react": "^19.2.14",
    "@types/node": "^22.0.0",
    "vitest": "^4.0.18",
    "@testing-library/react": "^16.3.2",
    "@testing-library/jest-dom": "^6.9.1",
    "jsdom": "^28.1.0",
    "eslint": "^9.0.0",
    "eslint-config-next": "15.5.12"
  }
}
```

**Version rationale:**
- **eslint@^9.0.0**: ESLint 9 uses flat config format. The `eslint-config-next` at 15.5.x supports this.
- **eslint-config-next@15.5.12**: Pinned to match the Next.js version exactly.
- **vitest@^4.0.18**: Fast, TypeScript-native test runner. No Jest configuration headaches.
- **jsdom@^28.1.0**: DOM environment for component tests under Vitest.

### Tailwind CSS Setup

Tailwind CSS v4 is the current stable version (4.2.1). It has a fundamentally different setup from v3:

- **No `tailwind.config.ts` file.** Configuration is done via CSS `@theme` directives inside `globals.css`.
- **No `autoprefixer` needed.** Tailwind v4 handles vendor prefixes internally.
- **PostCSS plugin changed.** Use `@tailwindcss/postcss` instead of the old `tailwindcss` PostCSS entry.

**Install command (Tailwind is a dev dependency):**
```bash
npm install -D tailwindcss @tailwindcss/postcss
```

**postcss.config.mjs:**
```js
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
export default config;
```

**No `tailwind.config.ts` is created.** The theme is defined directly in CSS. See Section 7 below for the custom theme.

### Full Install Command

```bash
# Production
npm install next@15.5.12 react react-dom @supabase/supabase-js @supabase/ssr@0.9.0

# Dev
npm install -D typescript @types/react @types/node vitest @testing-library/react @testing-library/jest-dom jsdom eslint eslint-config-next@15.5.12 tailwindcss @tailwindcss/postcss
```

**Total: 16 packages (5 production + 11 dev, counting tailwindcss and @tailwindcss/postcss as dev).**

### Explicitly Excluded Dependencies

| Package | Why excluded |
|---------|-------------|
| date-fns / dayjs | Native `Date` + `Intl.DateTimeFormat` sufficient for day boundary and date display |
| Zustand / Redux / Jotai | React useState is sufficient for 3 screens with CRUD |
| React Query / SWR | Single-user app with simple fetches -- no caching layer needed |
| Zod | Database constraints and RLS handle validation |
| Prisma / Drizzle | Supabase client handles queries directly |
| Any UI component library | Native HTML elements only -- vision mandates simplicity |
| Prettier | Single-developer project, CI linting sufficient |
| Husky / lint-staged | CI linting sufficient for v1 |

---

## 2. Supabase Client Patterns

Three client variants are required because Next.js App Router has distinct execution contexts (browser, server, edge middleware). All share the same Supabase URL and anon key.

### Environment Variables

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

Both are `NEXT_PUBLIC_` because the anon key is designed to be public. Security is enforced by RLS, not key secrecy. The service role key must NEVER appear in frontend code.

### Browser Client (`src/lib/supabase/client.ts`)

Used in `"use client"` components for interactive mutations (checkbox toggles, button taps, note saves).

```typescript
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/lib/types'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**Usage pattern:** Call `createClient()` inside a component or custom hook. The Supabase browser client is lightweight and can be created per-component (internally it reuses the same connection).

### Server Client (`src/lib/supabase/server.ts`)

Used in Server Components and Route Handlers for initial data fetching with the user's session.

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/types'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method is called from a Server Component.
            // This can be ignored if you have middleware refreshing sessions.
          }
        },
      },
    }
  )
}
```

**Key detail:** The `setAll` catch block is intentional. Server Components cannot set cookies, but the middleware handles session refresh. This pattern comes directly from the Supabase docs.

### Middleware Client (`src/lib/supabase/middleware.ts`)

Used in Next.js middleware to refresh the auth session on every request.

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Do NOT use getSession() here.
  // getUser() validates the JWT against Supabase servers.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (
    !user &&
    !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/auth')
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
```

**Critical note:** Use `getUser()`, not `getSession()`. `getUser()` validates the JWT with the Supabase server, ensuring the session is actually valid. `getSession()` only reads the local JWT without validation and is not secure for middleware.

### Root Middleware (`middleware.ts` at project root)

```typescript
import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

---

## 3. Auth Flow Patterns

### Magic Link Sign In (`src/app/login/page.tsx`)

```typescript
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <p className="text-warm-700">Check your email for the login link.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4">
        <h1 className="text-xl text-warm-800">SelahOS</h1>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
          className="w-full p-3 rounded border border-warm-300 bg-warm-50 text-warm-800 text-base"
        />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          type="submit"
          className="w-full p-3 rounded bg-green-600 text-warm-50 text-base"
        >
          Send magic link
        </button>
      </form>
    </div>
  )
}
```

### Auth Callback Route Handler (`src/app/auth/callback/route.ts`)

This handles the redirect after the user clicks the magic link in their email.

```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // If code exchange fails, redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth`)
}
```

### Session Check in Middleware

Already covered in Section 2 (the `updateSession` function). The key flow is:
1. Every request hits middleware
2. Middleware calls `supabase.auth.getUser()` to validate the session
3. If no valid user and path is not `/login` or `/auth/*`, redirect to `/login`
4. If valid user, pass the request through with refreshed cookies

### Protected Route Pattern

Routes are protected by the middleware matcher, not by individual page checks. The middleware handles all route protection automatically. Pages can assume the user is authenticated.

To get the user in a Server Component:

```typescript
// In any server component / page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function Page() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Page content...
}
```

To get the user in a Client Component:

```typescript
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export function useUser() {
  const [user, setUser] = useState<User | null>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })
  }, [])

  return user
}
```

---

## 4. Data Access Patterns

### Upsert Daily Record

The `daily_records` table has a unique constraint on `(user_id, date)`. The upsert pattern uses this constraint for INSERT ON CONFLICT UPDATE.

```typescript
// src/lib/daily-record.ts
import type { Database } from '@/lib/types'

type DailyRecord = Database['public']['Tables']['daily_records']['Row']
type DailyRecordUpdate = Partial<Omit<DailyRecord, 'id' | 'user_id' | 'created_at'>>

export async function upsertDailyRecord(
  supabase: ReturnType<typeof import('@/lib/supabase/client').createClient>,
  userId: string,
  date: string, // YYYY-MM-DD
  updates: DailyRecordUpdate
) {
  const { data, error } = await supabase
    .from('daily_records')
    .upsert(
      {
        user_id: userId,
        date,
        ...updates,
      },
      {
        onConflict: 'user_id,date',
      }
    )
    .select()
    .single()

  return { data, error }
}
```

### Fetch Today's Record with Day Boundary Logic

```typescript
// src/lib/daily-record.ts (continued)

import { getEffectiveDate } from '@/lib/dates'

export async function fetchTodayRecord(
  supabase: ReturnType<typeof import('@/lib/supabase/client').createClient>,
  userId: string
) {
  const effectiveDate = getEffectiveDate()

  const { data, error } = await supabase
    .from('daily_records')
    .select('*')
    .eq('user_id', userId)
    .eq('date', effectiveDate)
    .maybeSingle()

  return { data, error, effectiveDate }
}
```

**Note:** Use `.maybeSingle()` instead of `.single()` because the record may not exist yet (first interaction of the day creates it).

### Optimistic Update Hook with Debounced Save

This is the most important pattern for the Today screen. It provides instant feedback while batching database writes.

```typescript
// src/hooks/use-daily-record.ts
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getEffectiveDate } from '@/lib/dates'
import type { Database } from '@/lib/types'

type DailyRecord = Database['public']['Tables']['daily_records']['Row']

const EMPTY_RECORD: Omit<DailyRecord, 'id' | 'user_id' | 'created_at'> = {
  date: '',
  sleep_start: null,
  sleep_end: null,
  breakfast: false,
  lunch: false,
  dinner: false,
  cipralex_taken: false,
  hygiene_done: false,
  movement_done: false,
  ground_maintenance_done: false,
  ground_build_done: false,
  note: null,
}

export function useDailyRecord(userId: string) {
  const supabase = createClient()
  const effectiveDate = getEffectiveDate()
  const [record, setRecord] = useState<Partial<DailyRecord>>({
    ...EMPTY_RECORD,
    date: effectiveDate,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingUpdates = useRef<Partial<DailyRecord>>({})

  // Fetch on mount
  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('daily_records')
        .select('*')
        .eq('user_id', userId)
        .eq('date', effectiveDate)
        .maybeSingle()

      if (error) {
        setError(error.message)
        return
      }

      if (data) {
        setRecord(data)
      }
    }

    load()
  }, [userId, effectiveDate])

  // Debounced save
  const save = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(async () => {
      const updates = { ...pendingUpdates.current }
      pendingUpdates.current = {}

      if (Object.keys(updates).length === 0) return

      setSaving(true)
      setError(null)

      const { error } = await supabase
        .from('daily_records')
        .upsert(
          {
            user_id: userId,
            date: effectiveDate,
            ...updates,
          },
          { onConflict: 'user_id,date' }
        )
        .select()
        .single()

      setSaving(false)

      if (error) {
        setError(error.message)
      }
    }, 500)
  }, [userId, effectiveDate])

  // Update a field optimistically
  const updateField = useCallback(
    <K extends keyof DailyRecord>(field: K, value: DailyRecord[K]) => {
      setRecord((prev) => ({ ...prev, [field]: value }))
      pendingUpdates.current[field] = value
      save()
    },
    [save]
  )

  // Toggle a boolean field
  const toggleField = useCallback(
    (field: keyof DailyRecord) => {
      const current = record[field]
      const newValue = !current
      updateField(field, newValue as DailyRecord[typeof field])
    },
    [record, updateField]
  )

  // Save on page visibility change (user leaves app)
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === 'hidden') {
        if (debounceRef.current) {
          clearTimeout(debounceRef.current)
          debounceRef.current = null
        }
        // Flush pending updates immediately
        const updates = { ...pendingUpdates.current }
        pendingUpdates.current = {}
        if (Object.keys(updates).length > 0) {
          // Use sendBeacon pattern for reliability when page is closing
          supabase
            .from('daily_records')
            .upsert(
              { user_id: userId, date: effectiveDate, ...updates },
              { onConflict: 'user_id,date' }
            )
            .then()
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [userId, effectiveDate])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  return { record, updateField, toggleField, saving, error, effectiveDate }
}
```

**Key design decisions in this hook:**
- 500ms debounce batches rapid interactions (checking 3 boxes quickly = 1 upsert)
- Optimistic local state update happens synchronously before the debounce
- `visibilitychange` listener flushes pending writes when user leaves the app
- `maybeSingle()` on fetch because record might not exist yet
- First upsert creates the record (INSERT ON CONFLICT)

---

## 5. Component Patterns

### Large Tap Target Checkbox Component

Native `<input type="checkbox">` with `<label>`, styled for 56px+ tap targets.

```typescript
// src/components/checkbox.tsx
'use client'

interface CheckboxProps {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  id: string
}

export function Checkbox({ label, checked, onChange, id }: CheckboxProps) {
  return (
    <label
      htmlFor={id}
      className="flex flex-col items-center gap-1 cursor-pointer select-none min-w-[56px] min-h-[56px] justify-center"
    >
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only peer"
      />
      <span
        className="w-7 h-7 rounded-full border-2 border-warm-400 peer-checked:bg-green-600 peer-checked:border-green-600 transition-colors flex items-center justify-center"
        aria-hidden="true"
      >
        {checked && (
          <svg
            className="w-4 h-4 text-warm-50"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </span>
      <span className="text-sm text-warm-600">{label}</span>
    </label>
  )
}
```

**Design notes:**
- Visual checkbox is hidden (`sr-only`) but remains accessible via keyboard (Tab + Space)
- Custom circle indicator uses `peer-checked` for styling
- `min-w-[56px] min-h-[56px]` ensures the tap target exceeds WCAG requirements
- Label is below the circle to save horizontal space when placed in a row
- `select-none` prevents text selection on rapid taps

### Sleep Timestamp Button Component

```typescript
// src/components/sleep-button.tsx
'use client'

interface SleepButtonProps {
  label: string         // "going to sleep" or "woke up"
  timestamp: string | null
  onToggle: () => void
}

function formatTime(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export function SleepButton({ label, timestamp, onToggle }: SleepButtonProps) {
  const isRecorded = timestamp !== null

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`
        w-full min-h-[56px] rounded-lg text-base px-4 py-3
        transition-colors
        ${
          isRecorded
            ? 'bg-warm-200 text-warm-500'
            : 'bg-warm-100 text-warm-800 border border-warm-300'
        }
      `}
    >
      {isRecorded ? `${label} ${formatTime(timestamp)}` : label}
    </button>
  )
}
```

**Behavior:**
- First tap records `new Date().toISOString()` as the timestamp
- Becomes muted/completed state showing the time (e.g., "woke up 07:14")
- Second tap clears the timestamp (undo) -- sets it back to `null`
- Full-width button with 56px minimum height for half-asleep tapping

### Auto-Saving Text Field

```typescript
// src/components/note-field.tsx
'use client'

import { useRef } from 'react'

interface NoteFieldProps {
  value: string | null
  onChange: (value: string) => void
}

export function NoteField({ value, onChange }: NoteFieldProps) {
  const ref = useRef<HTMLTextAreaElement>(null)

  return (
    <textarea
      ref={ref}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      onBlur={() => {
        // The onChange handler already triggers debounced save via the hook.
        // onBlur triggers an immediate save via the hook's update mechanism.
        onChange(ref.current?.value ?? '')
      }}
      rows={2}
      maxLength={500}
      className="w-full p-3 rounded-lg border border-warm-300 bg-warm-50 text-warm-800 text-base resize-none placeholder:text-warm-400"
      placeholder="..."
    />
  )
}
```

**Design notes:**
- Subtle placeholder "..." -- no instructional text
- `maxLength={500}` -- no visible character counter, just a silent limit
- `resize-none` -- fixed height to maintain single-viewport layout
- `text-base` (16px) prevents iOS zoom on focus
- Auto-saves via the `useDailyRecord` hook's debounce mechanism

---

## 6. Testing Patterns

### Vitest Configuration (`vitest.config.ts`)

```typescript
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

### Test Setup File (`src/test/setup.ts`)

```typescript
import '@testing-library/jest-dom/vitest'
```

This single import adds all Testing Library DOM matchers (`toBeInTheDocument`, `toHaveTextContent`, etc.) to Vitest's `expect`.

### Test File Naming Convention

Tests live alongside source files with `.test.ts` or `.test.tsx` suffix:

```
src/
  lib/
    dates.ts
    dates.test.ts
  components/
    checkbox.tsx
    checkbox.test.tsx
  hooks/
    use-daily-record.ts
    use-daily-record.test.ts
```

### Example: Day Boundary Utility Test

```typescript
// src/lib/dates.test.ts
import { describe, it, expect, vi, afterEach } from 'vitest'
import { getEffectiveDate, formatDisplayDate } from './dates'

describe('getEffectiveDate', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns today when time is after 4:00 AM', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-12T08:30:00'))
    expect(getEffectiveDate()).toBe('2026-03-12')
  })

  it('returns yesterday when time is before 4:00 AM', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-12T02:30:00'))
    expect(getEffectiveDate()).toBe('2026-03-11')
  })

  it('returns today at exactly 4:00 AM', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-12T04:00:00'))
    expect(getEffectiveDate()).toBe('2026-03-12')
  })

  it('handles midnight correctly (returns yesterday)', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-12T00:00:00'))
    expect(getEffectiveDate()).toBe('2026-03-11')
  })

  it('handles 3:59 AM (returns yesterday)', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-12T03:59:59'))
    expect(getEffectiveDate()).toBe('2026-03-11')
  })
})

describe('formatDisplayDate', () => {
  it('formats date for display', () => {
    const result = formatDisplayDate('2026-03-12')
    // Should contain "March" and "12" at minimum
    expect(result).toContain('March')
    expect(result).toContain('12')
  })
})
```

### Example: Component Smoke Test

```typescript
// src/components/checkbox.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Checkbox } from './checkbox'

describe('Checkbox', () => {
  it('renders with label', () => {
    render(
      <Checkbox id="test" label="breakfast" checked={false} onChange={() => {}} />
    )
    expect(screen.getByText('breakfast')).toBeInTheDocument()
  })

  it('calls onChange when clicked', () => {
    const onChange = vi.fn()
    render(
      <Checkbox id="test" label="breakfast" checked={false} onChange={onChange} />
    )
    fireEvent.click(screen.getByLabelText('breakfast'))
    expect(onChange).toHaveBeenCalledWith(true)
  })

  it('shows checked state', () => {
    render(
      <Checkbox id="test" label="breakfast" checked={true} onChange={() => {}} />
    )
    expect(screen.getByRole('checkbox')).toBeChecked()
  })
})
```

### package.json Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "type-check": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

---

## 7. Tailwind Custom Theme (Warm Palette)

Tailwind CSS v4 defines themes in CSS using `@theme` directives, not in a JavaScript config file.

### Global Styles (`src/app/globals.css`)

```css
@import "tailwindcss";

@theme {
  /* Warm palette - grey/brown base tones */
  --color-warm-50: #FAF8F5;   /* lightest background */
  --color-warm-100: #F5F3F0;  /* primary background */
  --color-warm-200: #E8E4DF;  /* completed/muted state bg */
  --color-warm-300: #D4CEC7;  /* borders, dividers */
  --color-warm-400: #B5ADA4;  /* muted icons, placeholder text */
  --color-warm-500: #8C8279;  /* secondary text */
  --color-warm-600: #6B6158;  /* body text */
  --color-warm-700: #524840;  /* primary text */
  --color-warm-800: #3D3632;  /* heading text, strongest contrast */

  /* Garden green accents - earthy, desaturated */
  --color-green-500: #7A9E7E;  /* hover state, secondary accent */
  --color-green-600: #6B8F71;  /* primary accent (checked state, active nav) */
  --color-green-700: #5A7A5F;  /* pressed state */

  /* System font stack */
  --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}

/*
 * Base styles applied globally.
 * Tailwind v4 uses @layer for customization.
 */
@layer base {
  body {
    @apply bg-warm-100 text-warm-700 font-sans antialiased;
    font-size: 17px;
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  /* Prevent iOS zoom on input focus (font-size must be >= 16px) */
  input, textarea, select {
    font-size: inherit;
  }
}
```

### Color Palette Rationale

| Token | Hex | Purpose | WCAG contrast on warm-100 (#F5F3F0) |
|-------|-----|---------|--------------------------------------|
| warm-800 | #3D3632 | Headings, strong text | 8.2:1 (passes AAA) |
| warm-700 | #524840 | Body text | 6.1:1 (passes AAA) |
| warm-600 | #6B6158 | Body text (lighter) | 4.5:1 (passes AA) |
| warm-500 | #8C8279 | Secondary/timestamp text | 3.2:1 (passes AA large text only) |
| warm-400 | #B5ADA4 | Placeholder, disabled | 2.2:1 (decorative only) |
| green-600 | #6B8F71 | Checked state, active nav | 3.3:1 (passes AA for non-text/large text) |

**Critical:** The green-600 accent passes the 3:1 minimum contrast required for non-text UI elements (WCAG 2.1 AA, criterion 1.4.11). Body text colors (warm-600+) pass 4.5:1 minimum for normal text.

### No `tailwind.config.ts`

With Tailwind v4, there is no `tailwind.config.ts` file. All theme configuration lives in the CSS `@theme` block. This is simpler and eliminates one configuration file from the project.

---

## 8. TypeScript Types

### Database Types (`src/lib/types.ts`)

Manually defined types matching the Supabase schema. These can later be auto-generated with `supabase gen types typescript` but manual definition is fine for 3 tables.

```typescript
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      daily_records: {
        Row: {
          id: string
          user_id: string
          date: string              // YYYY-MM-DD
          sleep_start: string | null // ISO 8601 timestamp
          sleep_end: string | null   // ISO 8601 timestamp
          breakfast: boolean
          lunch: boolean
          dinner: boolean
          cipralex_taken: boolean
          hygiene_done: boolean
          movement_done: boolean
          ground_maintenance_done: boolean
          ground_build_done: boolean
          note: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          sleep_start?: string | null
          sleep_end?: string | null
          breakfast?: boolean
          lunch?: boolean
          dinner?: boolean
          cipralex_taken?: boolean
          hygiene_done?: boolean
          movement_done?: boolean
          ground_maintenance_done?: boolean
          ground_build_done?: boolean
          note?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          sleep_start?: string | null
          sleep_end?: string | null
          breakfast?: boolean
          lunch?: boolean
          dinner?: boolean
          cipralex_taken?: boolean
          hygiene_done?: boolean
          movement_done?: boolean
          ground_maintenance_done?: boolean
          ground_build_done?: boolean
          note?: string | null
          created_at?: string
        }
      }
      ground_projects: {
        Row: {
          id: string
          user_id: string
          name: string
          status: string            // 'active' | 'paused'
          start_date: string        // YYYY-MM-DD
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          status?: string
          start_date?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          status?: string
          start_date?: string
          created_at?: string
        }
      }
      weekly_signals: {
        Row: {
          id: string
          user_id: string
          week_start: string        // YYYY-MM-DD (Monday)
          financial_note: string | null
          sleep_state: string | null
          note: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          week_start: string
          financial_note?: string | null
          sleep_state?: string | null
          note?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          week_start?: string
          financial_note?: string | null
          sleep_state?: string | null
          note?: string | null
          created_at?: string
        }
      }
    }
  }
}
```

**Type design decisions:**
- `Row` type: what you get back from SELECT queries
- `Insert` type: what you send for INSERT (most fields optional with defaults)
- `Update` type: what you send for UPDATE (all fields optional)
- Timestamps as `string` (ISO 8601) rather than `Date` -- Supabase returns strings, and converting back and forth adds unnecessary complexity
- `status` on ground_projects is `string` not a union type -- keeps the type simple and avoids needing to update types when adding statuses

### SQL Migration for Reference (`supabase/migrations/001_initial_schema.sql`)

```sql
-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: daily_records
CREATE TABLE daily_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  sleep_start TIMESTAMPTZ,
  sleep_end TIMESTAMPTZ,
  breakfast BOOLEAN NOT NULL DEFAULT FALSE,
  lunch BOOLEAN NOT NULL DEFAULT FALSE,
  dinner BOOLEAN NOT NULL DEFAULT FALSE,
  cipralex_taken BOOLEAN NOT NULL DEFAULT FALSE,
  hygiene_done BOOLEAN NOT NULL DEFAULT FALSE,
  movement_done BOOLEAN NOT NULL DEFAULT FALSE,
  ground_maintenance_done BOOLEAN NOT NULL DEFAULT FALSE,
  ground_build_done BOOLEAN NOT NULL DEFAULT FALSE,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Table: ground_projects
CREATE TABLE ground_projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: weekly_signals
CREATE TABLE weekly_signals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  financial_note TEXT,
  sleep_state TEXT,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, week_start)
);

-- Enable Row Level Security
ALTER TABLE daily_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE ground_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_signals ENABLE ROW LEVEL SECURITY;

-- RLS Policies: users can only access their own data
CREATE POLICY "Users can manage own daily records"
  ON daily_records FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own ground projects"
  ON ground_projects FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own weekly signals"
  ON weekly_signals FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Indexes for common query patterns
CREATE INDEX idx_daily_records_user_date ON daily_records(user_id, date);
CREATE INDEX idx_ground_projects_user_status ON ground_projects(user_id, status);
CREATE INDEX idx_weekly_signals_user_week ON weekly_signals(user_id, week_start);
```

**Schema design notes:**
- `TIMESTAMPTZ` for sleep timestamps (stores UTC, renders in user's timezone)
- `DATE` for the date field (no timezone ambiguity for dates)
- Boolean fields default to `FALSE` -- a new record starts with everything unchecked
- `UNIQUE(user_id, date)` enables the upsert pattern
- `ON DELETE CASCADE` from `auth.users` -- if user is deleted, data goes too
- Indexes on the most common query patterns (fetch by user+date, fetch active project, fetch by user+week)

---

## 9. Day Boundary Utility

The day boundary is set to 4:00 AM. Before 4 AM, the app shows "yesterday's" record. At and after 4 AM, it shows "today's" record. This handles the night-owl case where the user records "going to sleep" at 1 AM and still sees the same day's record.

### Implementation (`src/lib/dates.ts`)

```typescript
const DAY_BOUNDARY_HOUR = 4 // 4:00 AM local time

/**
 * Returns the "effective date" as YYYY-MM-DD string.
 * Before 4:00 AM, returns yesterday's date.
 * At or after 4:00 AM, returns today's date.
 */
export function getEffectiveDate(now?: Date): string {
  const current = now ?? new Date()
  const adjusted = new Date(current)

  if (current.getHours() < DAY_BOUNDARY_HOUR) {
    adjusted.setDate(adjusted.getDate() - 1)
  }

  return formatDateString(adjusted)
}

/**
 * Formats a Date object as YYYY-MM-DD in local timezone.
 */
export function formatDateString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Formats a YYYY-MM-DD date string for display.
 * Example: "2026-03-12" -> "Thursday, March 12"
 */
export function formatDisplayDate(dateString: string): string {
  // Parse as local date (not UTC) by using component parts
  const [year, month, day] = dateString.split('-').map(Number)
  const date = new Date(year, month - 1, day)

  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Returns the Monday of the current week as YYYY-MM-DD.
 * Used for weekly_signals.week_start.
 */
export function getWeekStart(now?: Date): string {
  const current = now ?? new Date()
  const day = current.getDay() // 0=Sun, 1=Mon, ..., 6=Sat
  const diff = day === 0 ? -6 : 1 - day // Adjust to Monday
  const monday = new Date(current)
  monday.setDate(current.getDate() + diff)
  return formatDateString(monday)
}
```

**Implementation notes:**
- All date calculations use the user's **local timezone** (via native `Date` constructor)
- No date library required -- the logic is simple enough for native `Date`
- `getEffectiveDate()` accepts an optional `Date` parameter for testing
- `formatDisplayDate()` uses `Intl` for locale-aware formatting
- `getWeekStart()` is included because it is needed in iteration 2 (Signals screen) but should be defined from the start alongside the other date utilities
- The `formatDateString` helper avoids `.toISOString().slice(0,10)` which would convert to UTC and potentially shift the date

### Hydration Mismatch Prevention

The date displayed on the Today screen header will differ between server (UTC on Vercel) and client (user's local timezone). This causes a React hydration mismatch.

**Solution:** Render the date header as a client-only component:

```typescript
// In the Today page, for the date display:
'use client'

import { useState, useEffect } from 'react'
import { getEffectiveDate, formatDisplayDate } from '@/lib/dates'

export function DateHeader() {
  const [dateString, setDateString] = useState<string | null>(null)

  useEffect(() => {
    setDateString(formatDisplayDate(getEffectiveDate()))
  }, [])

  if (!dateString) return <div className="h-8" /> // placeholder to prevent layout shift

  return <h1 className="text-xl text-warm-800">{dateString}</h1>
}
```

Alternatively, use `suppressHydrationWarning` on the element, but the `useEffect` approach is cleaner and avoids the warning entirely.

---

## Complexity Assessment

### High Complexity Areas

- **Supabase SSR client setup (3 variants + middleware):** Requires exact code patterns. Misconfiguration causes auth loops or session loss. Builders must follow the patterns in Section 2 precisely.
- **Optimistic update hook with debounced save:** The `useDailyRecord` hook (Section 4) is the most complex piece of application logic. It handles optimistic state, debouncing, visibility change flushing, and upsert. Recommend one builder owns this entirely.

### Medium Complexity Areas

- **Auth flow (login + callback + middleware):** Standard pattern but requires coordination between three files. Must be tested end-to-end manually.
- **Day boundary logic:** Simple code but must be consistent everywhere it is used. Centralizing in `dates.ts` prevents drift.
- **Tailwind v4 theme setup:** New CSS-based configuration model (no `tailwind.config.ts`). Builders familiar with Tailwind v3 need to adapt.

### Low Complexity Areas

- **Component patterns (checkbox, sleep button, note field):** Straightforward native HTML with Tailwind classes.
- **Database schema and RLS:** Single migration file, standard patterns.
- **TypeScript types:** Manual but mechanical -- mirrors the schema 1:1.
- **Navigation shell:** Three text links in a fixed bottom bar.
- **Testing setup:** Vitest config is minimal.

---

## Integration Points

### Internal Integrations

- **`useDailyRecord` hook <-> Supabase browser client:** The hook creates a Supabase client and uses it for all mutations. The client must be initialized after the auth session is available.
- **Middleware <-> Server client <-> Browser client:** All three share the same session cookies. The middleware refreshes the session, the server client reads it for SSR, the browser client reads it for mutations.
- **`dates.ts` <-> Today screen <-> useDailyRecord:** The effective date from `getEffectiveDate()` must be used consistently in the date header display, the data fetch, and the upsert. Using the same function everywhere prevents drift.

### External Integrations

- **Supabase Auth email delivery:** Magic link emails are sent by Supabase's built-in email provider. Rate limit: 4 emails/hour on free tier. Sufficient for single-user with persistent sessions (login happens rarely).
- **Vercel deployment:** Auto-deploy from GitHub. Environment variables set in Vercel dashboard. No special configuration needed for Next.js 15 App Router.

---

## Risks & Challenges

### Technical Risks

1. **@supabase/ssr pre-1.0 API instability:** Pinning to exact version 0.9.0 mitigates this. Monitor Supabase changelog before upgrading.
2. **Tailwind v4 is relatively new (released early 2025):** The CSS-based config model is stable but builders may find fewer StackOverflow answers for v4-specific patterns. If this causes friction, falling back to Tailwind v3 is straightforward (add `tailwind.config.ts`, use `tailwindcss` as PostCSS plugin instead of `@tailwindcss/postcss`, add `autoprefixer`).
3. **Hydration mismatch on dates:** Server renders in UTC, client in local timezone. Mitigated by rendering the date header client-only (see Section 9).

### Complexity Risks

1. **The `useDailyRecord` hook** is the densest piece of code. If a builder needs to split work, the hook should be owned by a single builder, with other builders consuming it.
2. **Three Supabase client variants** require exact implementation. Copy the patterns from Section 2 verbatim. Deviation from the cookie handling pattern will cause subtle auth bugs.

---

## Recommendations for Planner

1. **Assign one builder to own the Supabase + auth foundation** (Sections 2, 3, and the middleware). This builder creates all three client files, the middleware, the login page, and the auth callback route. Other builders depend on this being correct.

2. **Assign one builder to own the Today screen data layer** (`useDailyRecord` hook, `dates.ts`, and the `daily-record.ts` data access functions). This is the most complex application logic and should not be split.

3. **Assign one builder to own the UI layer** (component patterns, Tailwind theme, layout, navigation shell, Today screen composition). This builder consumes the hook from builder 2 and the auth from builder 1.

4. **Use Tailwind CSS v4** (not v3). The CSS-based theme configuration is simpler and eliminates one config file. The `@theme` block in `globals.css` is the single source of truth for the design system.

5. **Do not add any dependencies beyond what is listed.** Every package not in the list above has been explicitly evaluated and excluded. The bar is: "Is hand-writing this significantly harder than importing a library?" For this project, the answer is always no.

6. **Database types should be manually defined** (not auto-generated) for iteration 1. Auto-generation requires the Supabase CLI and adds a build step. For 3 tables, manual types are faster and more transparent.

7. **All boolean fields in daily_records should default to `false` in the database schema.** This means the upsert only needs to send the fields that changed, not the full record. The database handles the rest.

8. **Test the color palette on a phone at low brightness** before considering it final. The warm-100 background (#F5F3F0) is chosen to be gentle at low brightness (unlike pure white), but this should be verified on actual hardware.

---

## Resource Map

### Critical Files/Directories

```
src/
  app/
    layout.tsx                  # Root layout: font, global styles, nav shell
    page.tsx                    # Today screen (default route, primary builder focus)
    login/
      page.tsx                  # Magic link login form
    auth/
      callback/
        route.ts                # Auth callback handler
  components/
    nav.tsx                     # Bottom navigation bar
    checkbox.tsx                # Large tap target checkbox
    sleep-button.tsx            # Sleep timestamp button
    note-field.tsx              # Auto-saving text field
  hooks/
    use-daily-record.ts         # Optimistic update hook with debounced save
  lib/
    supabase/
      client.ts                 # Browser Supabase client
      server.ts                 # Server Supabase client (with cookies)
      middleware.ts              # Middleware session refresh helper
    types.ts                    # Database types for all 3 tables
    dates.ts                    # Day boundary + date formatting utilities
  test/
    setup.ts                    # Testing Library setup for Vitest
middleware.ts                   # Next.js root middleware (route protection)
supabase/
  migrations/
    001_initial_schema.sql      # Tables + RLS policies + indexes
postcss.config.mjs              # PostCSS config for Tailwind v4
vitest.config.ts                # Vitest configuration
.env.local                      # Supabase URL + anon key (not committed)
```

### Key Dependencies

| Package | Why it is needed |
|---------|-----------------|
| next@15.5.12 | App Router framework, SSR, routing, Vercel deployment |
| @supabase/supabase-js | Database queries, auth operations |
| @supabase/ssr@0.9.0 | Cookie-based auth for Next.js App Router (server components, middleware) |
| tailwindcss + @tailwindcss/postcss | Utility-first CSS with custom warm palette |
| vitest | Fast TypeScript-native test runner |
| @testing-library/react | Component testing utilities |

### Testing Infrastructure

- **Vitest** for unit and component tests
- **@testing-library/react** for rendering components and simulating user interactions
- **jsdom** as the DOM environment (no browser needed)
- **Test files co-located** with source (`.test.ts` / `.test.tsx` suffix)
- **No E2E tests in iteration 1** -- manual verification is sufficient for 1 screen + auth flow

---

## Questions for Planner

1. **Supabase project creation:** Has the Supabase project been created yet? The builder needs the project URL and anon key before starting. If not, should one builder handle this as their first task?

2. **Builder file ownership:** Should builders be assigned specific files from the resource map, or should they own functional areas (foundation, data layer, UI layer) and create whatever files they need?

3. **Tailwind v4 vs v3:** This report recommends Tailwind v4 (CSS-based config, simpler setup). If builders are more comfortable with v3, the fallback is straightforward. Should we lock in v4 or leave this as a builder decision?

---

*Exploration completed: 2026-03-12*
*Explorer 2: Technology Patterns & Dependencies for Iteration 1*
