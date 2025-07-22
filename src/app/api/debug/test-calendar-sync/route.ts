import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
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

    // Test creating a calendar event
    try {
      const testEvent = {
        summary: 'Sentinel Test Event',
        description: 'This is a test event created by Sentinel to verify calendar integration.',
        start: {
          dateTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
          timeZone: 'UTC'
        },
        end: {
          dateTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(), // Tomorrow + 1 hour
          timeZone: 'UTC'
        },
        reminders: {
          useDefault: false,
          overrides: []
        }
      }

      const calendarResponse = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testEvent)
      })

      if (!calendarResponse.ok) {
        const errorData = await calendarResponse.text()
        return NextResponse.json({ 
          success: false,
          error: 'Failed to create test calendar event',
          status: calendarResponse.status,
          details: errorData
        })
      }

      const eventData = await calendarResponse.json()
      
      // Clean up the test event
      if (eventData.id) {
        await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventData.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${tokens.access_token}`
          }
        })
      }
      
      return NextResponse.json({ 
        success: true,
        message: 'Calendar sync test successful',
        eventCreated: true,
        eventId: eventData.id,
        eventLink: eventData.htmlLink
      })

    } catch (apiError) {
      return NextResponse.json({ 
        success: false,
        error: 'Calendar sync test failed',
        details: apiError instanceof Error ? apiError.message : 'Unknown API error'
      })
    }

  } catch (error) {
    console.error('Error testing calendar sync:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Failed to test calendar sync',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 