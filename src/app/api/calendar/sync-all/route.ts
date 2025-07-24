import { NextRequest, NextResponse } from 'next/server'
import { CalendarServerServiceFixed } from '@/lib/calendar-server-fixed'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = createSupabaseServerClient(request)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if calendar is connected
    const isConnected = await CalendarServerServiceFixed.isCalendarConnected(supabase)
    if (!isConnected) {
      return NextResponse.json({ 
        error: 'Calendar not connected',
        message: 'Please connect your Google Calendar first'
      }, { status: 400 })
    }

    // Sync all subscriptions
    const result = await CalendarServerServiceFixed.syncAllSubscriptions(supabase)

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${result.success} events to Google Calendar`,
      result
    })

  } catch (error) {
    console.error('Error in calendar sync endpoint:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      message: 'Failed to sync calendar events'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = createSupabaseServerClient(request)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get sync status
    const isConnected = await CalendarServerServiceFixed.isCalendarConnected(supabase)

    return NextResponse.json({
      connected: isConnected,
      upcomingEvents: 0, // Will be fetched client-side
      events: []
    })

  } catch (error) {
    console.error('Error getting calendar status:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      message: 'Failed to get calendar status'
    }, { status: 500 })
  }
} 