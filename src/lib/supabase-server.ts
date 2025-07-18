import { createServerClient } from '@supabase/ssr'
import { NextRequest } from 'next/server'

export function createSupabaseServerClient(request: NextRequest) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          const cookieStore = request.cookies
          return cookieStore.getAll().map(cookie => ({
            name: cookie.name,
            value: cookie.value
          }))
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          // In API routes, we can't set cookies directly
          // This is mainly for reading existing session cookies
        },
      },
    }
  )
} 