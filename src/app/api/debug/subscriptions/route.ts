import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient(request)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all subscriptions for the user
    const { data: subscriptions, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching subscriptions:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    // Get user's tokens
    const { data: tokens } = await supabase
      .from('gmail_tokens')
      .select('*')
      .eq('user_id', session.user.id)
      .single()

    return NextResponse.json({
      success: true,
      user: {
        id: session.user.id,
        email: session.user.email
      },
      subscriptions: subscriptions || [],
      subscriptionCount: subscriptions?.length || 0,
      tokens: tokens ? {
        hasAccessToken: !!tokens.access_token,
        hasRefreshToken: !!tokens.refresh_token,
        scope: tokens.scope,
        expiresAt: tokens.expires_at,
        hasCalendarScope: tokens.scope?.includes('https://www.googleapis.com/auth/calendar')
      } : null,
      databaseInfo: {
        hasCalendarFields: subscriptions?.[0] ? {
          calendar_event_id: 'calendar_event_id' in subscriptions[0],
          calendar_id: 'calendar_id' in subscriptions[0]
        } : null
      }
    })

  } catch (error) {
    console.error('Error in debug subscriptions endpoint:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      message: 'Failed to get debug info'
    }, { status: 500 })
  }
} 