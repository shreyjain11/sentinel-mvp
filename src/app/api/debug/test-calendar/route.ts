import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient(request)
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get tokens
    const { data: tokens, error: tokenError } = await supabase
      .from('gmail_tokens')
      .select('access_token, scope')
      .eq('user_id', session.user.id)
      .single()

    if (tokenError || !tokens) {
      return NextResponse.json({ 
        success: false,
        error: 'No tokens found',
        details: tokenError?.message || 'No tokens in database'
      })
    }

    // Check if we have calendar scope
    const hasCalendarScope = tokens.scope && 
      (tokens.scope.includes('https://www.googleapis.com/auth/calendar') ||
       tokens.scope.includes('https://www.googleapis.com/auth/calendar.events'))

    if (!hasCalendarScope) {
      return NextResponse.json({ 
        success: false,
        error: 'No calendar scope in tokens',
        scope: tokens.scope
      })
    }

    // Test calendar API call
    try {
      const calendarResponse = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!calendarResponse.ok) {
        const errorData = await calendarResponse.text()
        return NextResponse.json({ 
          success: false,
          error: 'Calendar API call failed',
          status: calendarResponse.status,
          details: errorData
        })
      }

      const calendarData = await calendarResponse.json()
      
      return NextResponse.json({ 
        success: true,
        message: 'Calendar API call successful',
        calendarsFound: calendarData.items?.length || 0,
        primaryCalendar: calendarData.items?.find((cal: any) => cal.primary)?.summary || 'Not found'
      })

    } catch (apiError) {
      return NextResponse.json({ 
        success: false,
        error: 'Calendar API call exception',
        details: apiError instanceof Error ? apiError.message : 'Unknown API error'
      })
    }

  } catch (error) {
    console.error('Error testing calendar:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Failed to test calendar',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 