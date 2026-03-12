import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  // Use x-forwarded-host for correct origin behind Vercel proxy
  const forwardedHost = request.headers.get('x-forwarded-host')
  const { origin } = new URL(request.url)
  const baseUrl = forwardedHost ? `https://${forwardedHost}` : origin

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${baseUrl}/os${next}`)
    }
  }

  return NextResponse.redirect(`${baseUrl}/os/login?error=auth`)
}
