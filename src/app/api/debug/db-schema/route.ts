import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = createSupabaseServerClient(request)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check subscriptions table structure
    const { data: subscriptions, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', session.user.id)
      .limit(1)

    // Check if user_calendars table exists
    const { data: calendars, error: calError } = await supabase
      .from('user_calendars')
      .select('*')
      .eq('user_id', session.user.id)
      .limit(1)

    // Get sample subscription to check fields
    const sampleSubscription = subscriptions?.[0] || null

    return NextResponse.json({
      success: true,
      databaseInfo: {
        subscriptionsTable: {
          exists: !subError,
          error: subError?.message,
          sampleFields: sampleSubscription ? Object.keys(sampleSubscription) : [],
          hasCalendarFields: sampleSubscription ? {
            calendar_event_id: 'calendar_event_id' in sampleSubscription,
            calendar_id: 'calendar_id' in sampleSubscription
          } : null
        },
        userCalendarsTable: {
          exists: !calError,
          error: calError?.message,
          hasData: calendars && calendars.length > 0
        }
      },
      userData: {
        userId: session.user.id,
        subscriptionCount: subscriptions?.length || 0,
        calendarCount: calendars?.length || 0
      }
    })

  } catch (error) {
    console.error('Error in debug schema endpoint:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      message: 'Failed to get database schema info'
    }, { status: 500 })
  }
} 