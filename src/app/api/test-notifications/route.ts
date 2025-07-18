import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient(request)
    
    // Test database connection
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      return NextResponse.json({ 
        error: 'Session error', 
        details: sessionError.message 
      }, { status: 401 })
    }

    if (!session) {
      return NextResponse.json({ 
        error: 'No session found' 
      }, { status: 401 })
    }

    const results = {
      notification_preferences: { exists: false, accessible: false, error: null as string | null },
      scheduled_notifications: { exists: false, accessible: false, error: null as string | null }
    }

    // Test notification_preferences table
    try {
      const { data: prefsData, error: prefsError } = await supabase
        .from('notification_preferences')
        .select('id')
        .limit(1)

      if (prefsError) {
        results.notification_preferences.error = prefsError.message
        results.notification_preferences.exists = !prefsError.message.includes('does not exist')
      } else {
        results.notification_preferences.exists = true
        results.notification_preferences.accessible = true
      }
    } catch (error) {
      results.notification_preferences.error = error instanceof Error ? error.message : 'Unknown error'
    }

    // Test scheduled_notifications table
    try {
      const { data: notifData, error: notifError } = await supabase
        .from('scheduled_notifications')
        .select('id')
        .limit(1)

      if (notifError) {
        results.scheduled_notifications.error = notifError.message
        results.scheduled_notifications.exists = !notifError.message.includes('does not exist')
      } else {
        results.scheduled_notifications.exists = true
        results.scheduled_notifications.accessible = true
      }
    } catch (error) {
      results.scheduled_notifications.error = error instanceof Error ? error.message : 'Unknown error'
    }

    const allTablesExist = results.notification_preferences.exists && results.scheduled_notifications.exists
    const allTablesAccessible = results.notification_preferences.accessible && results.scheduled_notifications.accessible

    return NextResponse.json({ 
      success: allTablesExist && allTablesAccessible,
      message: allTablesExist && allTablesAccessible 
        ? 'All notification tables are working correctly'
        : 'Some notification tables are missing or inaccessible',
      userId: session.user.id,
      tableResults: results,
      recommendation: allTablesExist 
        ? 'Tables exist but may have RLS policy issues'
        : 'Please run setup-notifications.sql in your Supabase dashboard'
    })

  } catch (error) {
    console.error('Test notifications error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 