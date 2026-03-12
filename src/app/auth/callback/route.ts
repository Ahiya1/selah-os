import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import type { Database } from '@/lib/types'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  // Use x-forwarded-host for correct origin behind Vercel proxy
  const forwardedHost = request.headers.get('x-forwarded-host')
  const { origin } = new URL(request.url)
  const baseUrl = forwardedHost ? `https://${forwardedHost}` : origin

  if (code) {
    const cookiesToSet: { name: string; value: string; options: Record<string, unknown> }[] = []

    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return [...request.headers.entries()]
              .filter(([key]) => key === 'cookie')
              .flatMap(([, value]) =>
                value.split(';').map((c) => {
                  const [name, ...rest] = c.trim().split('=')
                  return { name, value: rest.join('=') }
                })
              )
          },
          setAll(cookies) {
            cookiesToSet.push(...cookies.map(({ name, value, options }) => ({ name, value, options: options as Record<string, unknown> })))
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const response = NextResponse.redirect(`${baseUrl}/os${next}`)
      cookiesToSet.forEach(({ name, value, options }) => {
        response.cookies.set(name, value, options)
      })
      return response
    }
  }

  return NextResponse.redirect(`${baseUrl}/os/login?error=auth`)
}
