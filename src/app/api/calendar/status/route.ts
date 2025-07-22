import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient(request)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if we have valid tokens
    const { data: tokens, error } = await supabase
      .from('gmail_tokens')
      .select('access_token, scope, expires_at')
      .eq('user_id', session.user.id)
      .single()

    if (error || !tokens || !tokens.access_token) {
      console.log('No tokens found for user:', session.user.id)
      return NextResponse.json({ connected: false })
    }

    // Check if the scope includes calendar access
    const hasCalendarScope = tokens.scope && 
      (tokens.scope.includes('https://www.googleapis.com/auth/calendar') ||
       tokens.scope.includes('https://www.googleapis.com/auth/calendar.events'))

    // Check if token is not expired (with some buffer)
    const isTokenValid = tokens.expires_at && 
      new Date(tokens.expires_at) > new Date(Date.now() + 5 * 60 * 1000) // 5 min buffer

    console.log('Calendar status check:', {
      userId: session.user.id,
      hasCalendarScope,
      isTokenValid,
      expiresAt: tokens.expires_at,
      scope: tokens.scope
    })

    const connected = hasCalendarScope && isTokenValid

    return NextResponse.json({
      connected,
      hasCalendarScope,
      isTokenValid,
      expiresAt: tokens.expires_at,
      scope: tokens.scope
    })

  } catch (error) {
    console.error('Error checking calendar status:', error)
    return NextResponse.json({ 
      connected: false,
      error: 'Failed to check calendar status'
    })
  }
} 