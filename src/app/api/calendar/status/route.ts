import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient(request)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if we have valid calendar tokens
    const { data: tokens } = await supabase
      .from('gmail_tokens')
      .select('access_token, scope, expires_at')
      .eq('user_id', session.user.id)
      .single()

    if (!tokens || !tokens.access_token) {
      return NextResponse.json({ connected: false })
    }

    // Check if the scope includes calendar access
    const hasCalendarScope = tokens.scope && 
      tokens.scope.includes('https://www.googleapis.com/auth/calendar')

    // Check if token is not expired
    const isTokenValid = tokens.expires_at && 
      new Date(tokens.expires_at) > new Date()

    const connected = hasCalendarScope && isTokenValid

    return NextResponse.json({
      connected,
      hasCalendarScope,
      isTokenValid,
      expiresAt: tokens.expires_at
    })

  } catch (error) {
    console.error('Error checking calendar status:', error)
    return NextResponse.json({ 
      connected: false,
      error: 'Failed to check calendar status'
    })
  }
} 