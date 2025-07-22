import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient(request)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's calendar preferences
    const { data: calendar, error } = await supabase
      .from('user_calendars')
      .select('*')
      .eq('user_id', session.user.id)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching calendar preferences:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    const preferences = {
      autoSync: calendar?.auto_sync ?? true,
      syncTrials: calendar?.sync_trials ?? true,
      syncRenewals: calendar?.sync_renewals ?? true,
      showCanceled: calendar?.show_canceled ?? false
    }

    return NextResponse.json({
      success: true,
      preferences,
      lastSynced: calendar?.last_synced_at
    })

  } catch (error) {
    console.error('Error in calendar preferences endpoint:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      message: 'Failed to get calendar preferences'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient(request)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { preferences } = await request.json()

    // Check if user has a calendar record
    const { data: existingCalendar } = await supabase
      .from('user_calendars')
      .select('id')
      .eq('user_id', session.user.id)
      .single()

    if (existingCalendar) {
      // Update existing preferences
      const { error } = await supabase
        .from('user_calendars')
        .update({
          auto_sync: preferences.autoSync,
          sync_trials: preferences.syncTrials,
          sync_renewals: preferences.syncRenewals,
          show_canceled: preferences.showCanceled,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', session.user.id)

      if (error) {
        console.error('Error updating calendar preferences:', error)
        return NextResponse.json({ error: 'Database error' }, { status: 500 })
      }
    } else {
      // Create new preferences record (without calendar_id for now)
      const { error } = await supabase
        .from('user_calendars')
        .insert({
          user_id: session.user.id,
          calendar_id: 'temp_' + Date.now(), // Temporary ID
          calendar_name: 'Sentinel Calendar',
          auto_sync: preferences.autoSync,
          sync_trials: preferences.syncTrials,
          sync_renewals: preferences.syncRenewals,
          show_canceled: preferences.showCanceled
        })

      if (error) {
        console.error('Error creating calendar preferences:', error)
        return NextResponse.json({ error: 'Database error' }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Preferences saved successfully'
    })

  } catch (error) {
    console.error('Error in calendar preferences endpoint:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      message: 'Failed to save calendar preferences'
    }, { status: 500 })
  }
} 