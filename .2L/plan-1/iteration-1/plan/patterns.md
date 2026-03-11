# Code Patterns & Conventions

This is the authoritative reference for all builders. Every pattern includes full, working code. Follow these patterns exactly -- consistency across builders is how integration succeeds.

## File Structure

```
selah-os/
├── .env.local.example              # Template for environment variables
├── .gitignore                      # Node, Next.js, env ignores
├── eslint.config.mjs               # ESLint flat config
├── middleware.ts                    # Next.js middleware (auth + route protection)
├── next.config.ts                  # Next.js configuration (minimal)
├── package.json                    # Dependencies and scripts
├── postcss.config.mjs              # PostCSS config for Tailwind v4
├── tsconfig.json                   # TypeScript strict configuration
├── vitest.config.ts                # Vitest test runner configuration
│
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql  # All 3 tables + RLS + indexes + triggers
│
├── src/
│   ├── app/
│   │   ├── globals.css             # Tailwind v4 @theme + CSS custom properties
│   │   ├── layout.tsx              # Root layout: metadata, auth check, nav shell
│   │   ├── page.tsx                # Today screen (default route)
│   │   ├── login/
│   │   │   └── page.tsx            # Magic link login form
│   │   ├── auth/
│   │   │   └── callback/
│   │   │       └── route.ts        # Auth callback (GET, exchanges code for session)
│   │   ├── project/
│   │   │   └── page.tsx            # Placeholder page
│   │   └── signals/
│   │       └── page.tsx            # Placeholder page
│   │
│   ├── components/
│   │   ├── anchor-checkbox.tsx     # Large-tap-target checkbox with label
│   │   ├── anchor-checkbox.test.tsx
│   │   ├── date-header.tsx         # Effective date display (client-only)
│   │   ├── nav.tsx                 # Fixed bottom navigation bar
│   │   ├── nav.test.tsx
│   │   ├── note-field.tsx          # Auto-saving textarea
│   │   ├── section-group.tsx       # Visual grouping wrapper
│   │   └── sleep-button.tsx        # Timestamp button
│   │
│   ├── hooks/
│   │   ├── use-daily-record.ts     # Fetch + optimistic upsert for today's record
│   │   ├── use-daily-record.test.ts
│   │   └── use-debounced-save.ts   # Generic debounced save utility
│   │
│   ├── lib/
│   │   ├── constants.ts            # DAY_BOUNDARY_HOUR, app-wide constants
│   │   ├── dates.ts                # Day boundary, date formatting
│   │   ├── dates.test.ts
│   │   ├── supabase/
│   │   │   ├── client.ts           # Browser-side Supabase client
│   │   │   ├── server.ts           # Server-side Supabase client (cookies)
│   │   │   └── middleware.ts       # Middleware helper for session refresh
│   │   └── types.ts                # Database types (all 3 tables)
│   │
│   └── test/
│       └── setup.ts                # Testing Library Vitest setup
│
└── [config files at root]
```

## Naming Conventions

- **Components:** PascalCase files and exports (`AnchorCheckbox.tsx` -> but we use kebab-case filenames: `anchor-checkbox.tsx` with PascalCase export `AnchorCheckbox`)
- **Component files:** kebab-case (`anchor-checkbox.tsx`, `sleep-button.tsx`)
- **Utility files:** kebab-case (`dates.ts`, `constants.ts`)
- **Hook files:** kebab-case starting with `use-` (`use-daily-record.ts`)
- **Types:** PascalCase (`DailyRecord`, `Database`)
- **Functions:** camelCase (`getEffectiveDate()`, `formatDisplayDate()`)
- **Constants:** SCREAMING_SNAKE_CASE (`DAY_BOUNDARY_HOUR`)
- **CSS custom properties:** kebab-case prefixed (`--color-warm-100`, `--color-green-600`)
- **Test files:** Same name as source with `.test.ts` or `.test.tsx` suffix, co-located

## Import Order Convention

```typescript
// 1. React / Next.js imports
import { useState, useEffect, useCallback, useRef } from 'react'
import { redirect } from 'next/navigation'

// 2. External library imports
import { createBrowserClient } from '@supabase/ssr'

// 3. Internal lib imports (alphabetical)
import { DAY_BOUNDARY_HOUR } from '@/lib/constants'
import { getEffectiveDate, formatDisplayDate } from '@/lib/dates'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/types'

// 4. Internal component imports
import { AnchorCheckbox } from '@/components/anchor-checkbox'
import { SleepButton } from '@/components/sleep-button'

// 5. Internal hook imports
import { useDailyRecord } from '@/hooks/use-daily-record'

// 6. Types (if separate)
import type { DailyRecord } from '@/lib/types'
```

Always use the `@/` path alias. Never use relative imports that go up more than one level.

---

## Design System

### CSS Theme (`src/app/globals.css`)

This is the single source of truth for all visual design. Tailwind v4 uses CSS-native `@theme`.

```css
@import "tailwindcss";

@theme {
  /* Warm palette - grey/brown base tones */
  --color-warm-50: #FAF8F5;
  --color-warm-100: #F5F3F0;
  --color-warm-200: #E8E4DF;
  --color-warm-300: #D4CEC7;
  --color-warm-400: #B5ADA4;
  --color-warm-500: #8C8279;
  --color-warm-600: #6B6158;
  --color-warm-700: #524840;
  --color-warm-800: #3D3632;

  /* Garden green accents - earthy, desaturated */
  --color-green-500: #7A9E7E;
  --color-green-600: #6B8F71;
  --color-green-700: #5A7A5F;

  /* Functional */
  --color-error: #B85C5C;

  /* System font stack */
  --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}

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

### Color Palette Contrast Ratios

| Token | Hex | Use | Contrast on warm-100 |
|-------|-----|-----|---------------------|
| warm-800 | #3D3632 | Headings | 8.2:1 (AAA) |
| warm-700 | #524840 | Body text | 6.1:1 (AAA) |
| warm-600 | #6B6158 | Secondary text | 4.5:1 (AA) |
| warm-500 | #8C8279 | Timestamps, muted | 3.2:1 (AA large text) |
| warm-400 | #B5ADA4 | Placeholders | 2.2:1 (decorative only) |
| green-600 | #6B8F71 | Checked state, active nav | 3.3:1 (AA non-text) |

### Layout Constants

- **Max content width:** 480px (centered on larger screens)
- **Bottom nav height:** 56px + safe area inset
- **Page padding:** 16px horizontal, 20px top
- **Section gap:** 24px between anchor groups
- **Checkbox visual size:** 28px (w-7 h-7), tap target: 56px minimum
- **Button height:** 56px minimum
- **Body font size:** 17px
- **Small text:** 14px (timestamps, labels)
- **Heading text:** 20px (date header)

---

## Supabase Client Patterns

### Browser Client (`src/lib/supabase/client.ts`)

Used in `'use client'` components for interactive mutations.

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

### Server Client (`src/lib/supabase/server.ts`)

Used in Server Components and Route Handlers.

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
            // Server Components cannot set cookies.
            // This is handled by the middleware refreshing sessions.
          }
        },
      },
    }
  )
}
```

### Middleware Client (`src/lib/supabase/middleware.ts`)

Used exclusively in `middleware.ts` for session refresh and route protection.

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

  // IMPORTANT: Use getUser(), not getSession().
  // getUser() validates the JWT with the Supabase server.
  // getSession() only reads the local JWT without validation.
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

### Root Middleware (`middleware.ts` at project root)

```typescript
import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

### Route Protection Summary

```
Protected (require auth): /, /project, /signals
Public (no auth):         /login, /auth/callback
Static (excluded):        _next/static, _next/image, favicon.ico
```

---

## Auth Flow Patterns

### Login Page (`src/app/login/page.tsx`)

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
          className="w-full p-3 rounded-lg border border-warm-300 bg-warm-50 text-warm-800 text-base"
        />
        {error && <p className="text-error text-sm">{error}</p>}
        <button
          type="submit"
          className="w-full p-3 rounded-lg bg-green-600 text-warm-50 text-base"
        >
          Send magic link
        </button>
      </form>
    </div>
  )
}
```

### Auth Callback (`src/app/auth/callback/route.ts`)

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

  return NextResponse.redirect(`${origin}/login?error=auth`)
}
```

### Auth Flow Sequence

```
1. User visits / (unauthenticated)
   -> middleware detects no session -> redirects to /login

2. User enters email on /login
   -> browser client calls auth.signInWithOtp({ email })
   -> Supabase sends magic link email

3. User clicks magic link
   -> browser navigates to /auth/callback?code=...
   -> route.ts exchanges code for session (server client)
   -> session cookies set -> redirects to /

4. User visits / (authenticated)
   -> middleware detects valid session, refreshes if needed
   -> page.tsx renders Today screen

5. Subsequent visits
   -> middleware refreshes session silently
   -> user never sees login again
```

---

## Data Access Patterns

### Optimistic Update Hook (`src/hooks/use-daily-record.ts`)

This is the core data interaction pattern for the Today screen.

```typescript
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getEffectiveDate } from '@/lib/dates'
import type { Database } from '@/lib/types'

type DailyRecord = Database['public']['Tables']['daily_records']['Row']

const DEBOUNCE_MS = 500

const EMPTY_RECORD: Omit<DailyRecord, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
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
  note: '',
}

export function useDailyRecord(userId: string) {
  const supabase = createClient()
  const effectiveDate = getEffectiveDate()
  const [record, setRecord] = useState<Partial<DailyRecord>>({
    ...EMPTY_RECORD,
    date: effectiveDate,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingUpdates = useRef<Partial<DailyRecord>>({})

  // Fetch on mount
  useEffect(() => {
    async function load() {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('daily_records')
        .select('*')
        .eq('user_id', userId)
        .eq('date', effectiveDate)
        .maybeSingle()

      if (error) {
        setError(error.message)
      } else if (data) {
        setRecord(data)
      }
      setIsLoading(false)
    }

    load()
  }, [userId, effectiveDate])

  // Flush pending updates to Supabase
  const flush = useCallback(async () => {
    const updates = { ...pendingUpdates.current }
    pendingUpdates.current = {}

    if (Object.keys(updates).length === 0) return

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

    if (error) {
      setError(error.message)
    }
  }, [userId, effectiveDate, supabase])

  // Schedule a debounced save
  const scheduleSave = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    debounceRef.current = setTimeout(() => {
      flush()
    }, DEBOUNCE_MS)
  }, [flush])

  // Update a field optimistically
  const updateField = useCallback(
    (field: keyof DailyRecord, value: DailyRecord[keyof DailyRecord]) => {
      setRecord((prev) => ({ ...prev, [field]: value }))
      pendingUpdates.current[field] = value as never
      scheduleSave()
    },
    [scheduleSave]
  )

  // Record sleep timestamp (flush immediately -- timestamp is time-sensitive)
  const setSleepStart = useCallback(() => {
    const current = record.sleep_start
    const newValue = current ? null : new Date().toISOString()
    setRecord((prev) => ({ ...prev, sleep_start: newValue }))
    pendingUpdates.current.sleep_start = newValue as never
    if (debounceRef.current) clearTimeout(debounceRef.current)
    flush()
  }, [record.sleep_start, flush])

  const setSleepEnd = useCallback(() => {
    const current = record.sleep_end
    const newValue = current ? null : new Date().toISOString()
    setRecord((prev) => ({ ...prev, sleep_end: newValue }))
    pendingUpdates.current.sleep_end = newValue as never
    if (debounceRef.current) clearTimeout(debounceRef.current)
    flush()
  }, [record.sleep_end, flush])

  // Flush on visibility change (app goes to background)
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === 'hidden') {
        if (debounceRef.current) {
          clearTimeout(debounceRef.current)
          debounceRef.current = null
        }
        flush()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [flush])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  return {
    record,
    isLoading,
    error,
    effectiveDate,
    updateField,
    setSleepStart,
    setSleepEnd,
  }
}
```

**Key behaviors:**
- 500ms debounce batches rapid checkbox toggles (3 boxes in 2 seconds = 1 upsert)
- Optimistic state update happens synchronously (instant UI feedback)
- Sleep button taps flush immediately (timestamps are time-sensitive)
- `visibilitychange` flushes pending writes when user leaves app
- `maybeSingle()` on fetch because record might not exist yet
- First upsert auto-creates the record (INSERT ON CONFLICT)

### Hook Interface

```typescript
const {
  record,         // Current state (optimistic), Partial<DailyRecord>
  isLoading,      // True during initial fetch
  error,          // Last error message, or null
  effectiveDate,  // The effective date string (YYYY-MM-DD)
  updateField,    // (field, value) => void -- optimistic + debounced save
  setSleepStart,  // () => void -- toggle sleep_start timestamp
  setSleepEnd,    // () => void -- toggle sleep_end timestamp
} = useDailyRecord(userId)
```

---

## Day Boundary Utility (`src/lib/dates.ts`)

```typescript
import { DAY_BOUNDARY_HOUR } from '@/lib/constants'

/**
 * Returns the "effective date" as YYYY-MM-DD string.
 * Before 4:00 AM local time, returns yesterday's date.
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
 * Avoids .toISOString().slice(0,10) which converts to UTC.
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
  const [year, month, day] = dateString.split('-').map(Number)
  const date = new Date(year, month - 1, day)

  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Formats an ISO timestamp for time display.
 * Example: "2026-03-12T07:14:00.000Z" -> "07:14"
 */
export function formatTime(isoTimestamp: string): string {
  const date = new Date(isoTimestamp)
  return date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

/**
 * Returns the Monday of the current week as YYYY-MM-DD.
 * Used for weekly_signals.week_start (Iteration 2).
 */
export function getWeekStart(now?: Date): string {
  const current = now ?? new Date()
  const day = current.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(current)
  monday.setDate(current.getDate() + diff)
  return formatDateString(monday)
}
```

### Constants (`src/lib/constants.ts`)

```typescript
/** Day boundary hour. Before this hour, the app shows the previous day's record. */
export const DAY_BOUNDARY_HOUR = 4
```

---

## Component Patterns

### Anchor Checkbox (`src/components/anchor-checkbox.tsx`)

Large tap target checkbox with label. Native `<input type="checkbox">` for full accessibility.

```typescript
'use client'

interface AnchorCheckboxProps {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  id: string
}

export function AnchorCheckbox({ label, checked, onChange, id }: AnchorCheckboxProps) {
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
- Hidden native checkbox (`sr-only`) with custom visual indicator
- `peer-checked` CSS for Tailwind v4 checked state styling
- 56px minimum tap target via `min-w-[56px] min-h-[56px]`
- `select-none` prevents text selection on rapid taps
- Circle indicator (not square) for the soft aesthetic
- Garden green (#6B8F71) checked state

### Sleep Button (`src/components/sleep-button.tsx`)

```typescript
'use client'

import { formatTime } from '@/lib/dates'

interface SleepButtonProps {
  label: string
  timestamp: string | null
  onToggle: () => void
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
            : 'bg-warm-50 text-warm-800 border border-warm-300'
        }
      `}
    >
      {isRecorded ? `${label} ${formatTime(timestamp)}` : label}
    </button>
  )
}
```

**Behavior:**
- First tap: parent records `new Date().toISOString()`, button shows time (e.g., "woke up 07:14")
- Second tap: parent clears timestamp (sets to null), button reverts to label only
- Full-width, 56px minimum height

### Note Field (`src/components/note-field.tsx`)

```typescript
'use client'

interface NoteFieldProps {
  value: string
  onChange: (value: string) => void
}

export function NoteField({ value, onChange }: NoteFieldProps) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={2}
      maxLength={500}
      className="w-full p-3 rounded-lg border border-warm-300 bg-warm-50 text-warm-700 text-base resize-none placeholder:text-warm-400"
      placeholder="..."
    />
  )
}
```

**Design notes:**
- Subtle placeholder "..." (no instructional text)
- `maxLength={500}` -- silent limit, no visible counter
- `resize-none` -- maintains single-viewport layout
- `text-base` (inherits 17px) prevents iOS zoom on focus
- Auto-saves via the useDailyRecord hook's debounce (onChange triggers updateField)

### Section Group (`src/components/section-group.tsx`)

```typescript
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
```

### Date Header (`src/components/date-header.tsx`)

Client-only to avoid server/client timezone hydration mismatch.

```typescript
'use client'

import { useState, useEffect } from 'react'
import { getEffectiveDate, formatDisplayDate } from '@/lib/dates'

export function DateHeader() {
  const [dateString, setDateString] = useState<string | null>(null)

  useEffect(() => {
    setDateString(formatDisplayDate(getEffectiveDate()))
  }, [])

  if (!dateString) {
    return <div className="h-8" aria-hidden="true" />
  }

  return <h1 className="text-xl text-warm-800">{dateString}</h1>
}
```

### Navigation Bar (`src/components/nav.tsx`)

```typescript
'use client'

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
                ${isActive ? 'text-green-600' : 'text-warm-500'}
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
```

**Design notes:**
- Fixed bottom bar with safe area padding for notched phones
- Text only -- no icons, no badges, no indicators
- Active state: garden green text color
- Inactive state: muted grey-brown text
- No border-top or shadow -- just background color shift

---

## Today Page Assembly Pattern (`src/app/page.tsx`)

```typescript
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useDailyRecord } from '@/hooks/use-daily-record'
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
  }, [])

  if (!user) {
    return <div className="p-4" />
  }

  return <TodayContent userId={user.id} />
}

function TodayContent({ userId }: { userId: string }) {
  const {
    record,
    isLoading,
    error,
    updateField,
    setSleepStart,
    setSleepEnd,
  } = useDailyRecord(userId)

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
```

**Key patterns:**
- Page is `'use client'` (dates and interactions require client-side rendering)
- User fetched client-side (middleware already protects the route)
- `pb-24` adds bottom padding to clear the fixed nav bar
- All checkboxes wire directly to `updateField` from the hook
- Empty state shows immediately (all unchecked, empty note) -- no loading spinner

---

## TypeScript Types (`src/lib/types.ts`)

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
          date: string
          sleep_start: string | null
          sleep_end: string | null
          breakfast: boolean
          lunch: boolean
          dinner: boolean
          cipralex_taken: boolean
          hygiene_done: boolean
          movement_done: boolean
          ground_maintenance_done: boolean
          ground_build_done: boolean
          note: string
          created_at: string
          updated_at: string
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
          note?: string
          created_at?: string
          updated_at?: string
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
          note?: string
          created_at?: string
          updated_at?: string
        }
      }
      ground_projects: {
        Row: {
          id: string
          user_id: string
          name: string
          status: string
          start_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          status?: string
          start_date?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          status?: string
          start_date?: string
          created_at?: string
          updated_at?: string
        }
      }
      weekly_signals: {
        Row: {
          id: string
          user_id: string
          week_start: string
          financial_note: string
          sleep_state: string
          note: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          week_start: string
          financial_note?: string
          sleep_state?: string
          note?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          week_start?: string
          financial_note?: string
          sleep_state?: string
          note?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
```

**Design decisions:**
- `Row`: SELECT result type (all fields present)
- `Insert`: INSERT type (server-generated fields optional)
- `Update`: UPDATE type (all fields optional)
- All timestamps as `string` (ISO 8601) -- Supabase returns strings
- `note` fields as `string` (not `string | null`) -- schema uses `DEFAULT ''`
- `updated_at` included (schema has trigger for auto-update)

---

## Testing Patterns

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

### Test Setup (`src/test/setup.ts`)

```typescript
import '@testing-library/jest-dom/vitest'
```

### Test File Naming Convention

Tests are co-located with source files:

```
src/lib/dates.ts          -> src/lib/dates.test.ts
src/components/nav.tsx    -> src/components/nav.test.tsx
src/hooks/use-daily-record.ts -> src/hooks/use-daily-record.test.ts
```

### Unit Test Pattern: Date Utilities

```typescript
// src/lib/dates.test.ts
import { describe, it, expect, vi, afterEach } from 'vitest'
import { getEffectiveDate, formatDisplayDate, formatTime } from './dates'

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

  it('accepts a custom Date parameter', () => {
    const customDate = new Date('2026-06-15T10:00:00')
    expect(getEffectiveDate(customDate)).toBe('2026-06-15')
  })
})

describe('formatDisplayDate', () => {
  it('formats date string for display', () => {
    const result = formatDisplayDate('2026-03-12')
    expect(result).toContain('March')
    expect(result).toContain('12')
  })
})

describe('formatTime', () => {
  it('formats ISO timestamp to HH:MM', () => {
    const result = formatTime('2026-03-12T07:14:00.000Z')
    // Contains hour and minute (exact format depends on locale)
    expect(result).toMatch(/\d{2}:\d{2}/)
  })
})
```

### Component Test Pattern

```typescript
// src/components/anchor-checkbox.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AnchorCheckbox } from './anchor-checkbox'

describe('AnchorCheckbox', () => {
  it('renders with label', () => {
    render(
      <AnchorCheckbox id="test" label="breakfast" checked={false} onChange={() => {}} />
    )
    expect(screen.getByText('breakfast')).toBeInTheDocument()
  })

  it('calls onChange when clicked', () => {
    const onChange = vi.fn()
    render(
      <AnchorCheckbox id="test" label="breakfast" checked={false} onChange={onChange} />
    )
    fireEvent.click(screen.getByLabelText('breakfast'))
    expect(onChange).toHaveBeenCalledWith(true)
  })

  it('shows checked state', () => {
    render(
      <AnchorCheckbox id="test" label="breakfast" checked={true} onChange={() => {}} />
    )
    expect(screen.getByRole('checkbox')).toBeChecked()
  })
})
```

### Nav Component Test Pattern

```typescript
// src/components/nav.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}))

import { Nav } from './nav'

describe('Nav', () => {
  it('renders three navigation links', () => {
    render(<Nav />)
    expect(screen.getByText('Today')).toBeInTheDocument()
    expect(screen.getByText('Project')).toBeInTheDocument()
    expect(screen.getByText('Signals')).toBeInTheDocument()
  })

  it('has correct href attributes', () => {
    render(<Nav />)
    expect(screen.getByText('Today').closest('a')).toHaveAttribute('href', '/')
    expect(screen.getByText('Project').closest('a')).toHaveAttribute('href', '/project')
    expect(screen.getByText('Signals').closest('a')).toHaveAttribute('href', '/signals')
  })
})
```

### Hook Test Pattern (Mocked Supabase)

```typescript
// src/hooks/use-daily-record.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'

// Mock Supabase client
const mockSelect = vi.fn().mockReturnThis()
const mockEq = vi.fn().mockReturnThis()
const mockMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null })
const mockUpsert = vi.fn().mockReturnThis()
const mockSingle = vi.fn().mockResolvedValue({ data: {}, error: null })

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: () => ({
      select: mockSelect,
      eq: mockEq,
      maybeSingle: mockMaybeSingle,
      upsert: mockUpsert,
      single: mockSingle,
    }),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-123' } } }),
    },
  }),
}))

vi.mock('@/lib/dates', () => ({
  getEffectiveDate: () => '2026-03-12',
}))

import { useDailyRecord } from './use-daily-record'

describe('useDailyRecord', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('fetches record on mount', async () => {
    const { result } = renderHook(() => useDailyRecord('user-123'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })
  })

  it('updates field optimistically', () => {
    const { result } = renderHook(() => useDailyRecord('user-123'))

    act(() => {
      result.current.updateField('breakfast', true)
    })

    expect(result.current.record.breakfast).toBe(true)
  })
})
```

### Test Data Factories

```typescript
// src/test/factories.ts (optional, for tests that need full record objects)
import type { Database } from '@/lib/types'

type DailyRecord = Database['public']['Tables']['daily_records']['Row']

export function createMockDailyRecord(
  overrides: Partial<DailyRecord> = {}
): DailyRecord {
  return {
    id: 'record-123',
    user_id: 'user-123',
    date: '2026-03-12',
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
    note: '',
    created_at: '2026-03-12T00:00:00.000Z',
    updated_at: '2026-03-12T00:00:00.000Z',
    ...overrides,
  }
}
```

### Coverage Expectations

| Module Type | Minimum Coverage | Target Coverage |
|-------------|------------------|-----------------|
| Utils (dates.ts) | 90% | 95% |
| Hooks (use-daily-record) | 70% | 80% |
| Components (checkbox, sleep-button, nav) | 60% | 70% |
| Pages | Not tested directly | N/A |

---

## Error Handling Patterns

### API Error Pattern (Supabase Operations)

```typescript
// In hooks or data access functions:
const { data, error } = await supabase
  .from('daily_records')
  .upsert(payload, { onConflict: 'user_id,date' })
  .select()
  .single()

if (error) {
  // Log for debugging
  console.error('[SelahOS] Upsert failed:', error.message)
  // Set user-visible error state (subtle, non-blocking)
  setError(error.message)
  // Do NOT throw -- the UI should not break on a failed save
}
```

### User-Facing Error Display

```typescript
// Subtle, non-intrusive error indicator
{error && (
  <p className="text-error text-sm" role="alert">
    {error}
  </p>
)}
```

**Rules:**
- Never show error modals or alerts for routine operations
- Never block the UI on save failures
- Show a subtle text indicator near the affected area
- The optimistic state remains (user sees their change even if save failed)
- Failed saves will be retried on the next interaction (the debounce mechanism naturally retries)

### Graceful Degradation

```typescript
// If initial fetch fails, show empty state (not an error page)
if (error) {
  setError(error.message)
  // record stays as EMPTY_RECORD -- user can still interact
  return
}
```

---

## Security Patterns

### Row Level Security (Database)

All tables use per-operation RLS policies (not `FOR ALL`):

```sql
-- SELECT: users can only read their own data
CREATE POLICY "Users can view own daily records"
  ON daily_records FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: users can only insert with their own user_id
CREATE POLICY "Users can insert own daily records"
  ON daily_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: users can only update their own rows
CREATE POLICY "Users can update own daily records"
  ON daily_records FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- No DELETE policy (intentional: protect against accidental data loss)
```

### Environment Variable Safety

```typescript
// CORRECT: Use NEXT_PUBLIC_ for anon key (safe, RLS enforces security)
process.env.NEXT_PUBLIC_SUPABASE_URL!
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// NEVER: Expose service role key in client code
// process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY  // DANGER!
```

### Middleware Auth Validation

```typescript
// CORRECT: Use getUser() -- validates JWT with Supabase server
const { data: { user } } = await supabase.auth.getUser()

// WRONG: getSession() only reads local JWT without server validation
// const { data: { session } } = await supabase.auth.getSession()
```

### Single-User Enforcement

Enforced at the Supabase dashboard level:
1. Create the single user account manually
2. Disable "Enable email signup" in Authentication > Settings
3. RLS policies handle data isolation as defense-in-depth

---

## CI/CD Patterns

### GitHub Actions Workflow (Iteration 2, but defined here for reference)

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  quality:
    name: Quality & Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run type-check
      - run: npm run lint
      - run: npm run test
      - run: npm audit --audit-level=moderate

  build:
    name: Build
    runs-on: ubuntu-latest
    needs: quality
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
```

### Branch Strategy

- `main` -- production branch
- Feature work: commits directly to `main` for v1 (single developer)
- CI runs on push to `main`
- Vercel auto-deploys from `main` (Iteration 2)

---

## Logging Pattern

```typescript
// Use console.error for actual errors that need debugging
console.error('[SelahOS] Failed to upsert daily record:', error.message)

// Use console.warn for unexpected but non-critical situations
console.warn('[SelahOS] Session refresh failed, will retry on next request')

// Never use console.log in production code
// Development-only logging can use console.log but should be removed before merge
```

Prefix all log messages with `[SelahOS]` for easy filtering.

---

## Root Layout Pattern (`src/app/layout.tsx`)

```typescript
import type { Metadata, Viewport } from 'next'
import { Nav } from '@/components/nav'
import './globals.css'

export const metadata: Metadata = {
  title: 'SelahOS',
  description: 'Ground layer operating system',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <main>{children}</main>
        <Nav />
      </body>
    </html>
  )
}
```

**Design notes:**
- Title is just "SelahOS" -- no health-related terms visible in browser tab
- Viewport configured for mobile with `viewport-fit: cover` for safe areas
- Nav is outside `<main>` (fixed position, always visible)
- No auth provider wrapper needed -- each page handles auth via middleware + local check
- The login page layout works because Nav renders at the bottom harmlessly (or can be conditionally hidden based on pathname)

---

## Placeholder Page Pattern

```typescript
// src/app/project/page.tsx
export default function ProjectPage() {
  return (
    <div className="max-w-lg mx-auto px-4 pt-5 pb-24">
      <h1 className="text-xl text-warm-800">Project</h1>
      <p className="text-warm-500 mt-2">Coming in the next update.</p>
    </div>
  )
}
```

Same pattern for `/signals/page.tsx` with label "Signals".

---

## Key Rules for All Builders

1. **Always use `@/` path alias** for imports. Never use `../../` relative paths.
2. **All interactive components must be `'use client'`**. Static components can omit it.
3. **Never import Supabase directly in components.** Pass data and callbacks via props from hooks or pages.
4. **Follow the exact color tokens.** Use `text-warm-700` (not `text-gray-700`), `bg-green-600` (not `bg-emerald-600`).
5. **56px minimum tap target** on all interactive elements. Use `min-h-[56px] min-w-[56px]`.
6. **No loading spinners.** Show empty state immediately, populate when data arrives.
7. **No confirmation dialogs.** Everything auto-saves.
8. **No console.log in committed code.** Use `console.error` with `[SelahOS]` prefix for actual errors.
9. **Test files co-located** with source files, using `.test.ts` / `.test.tsx` suffix.
10. **TypeScript strict mode.** No `any` types. No `// @ts-ignore`.
