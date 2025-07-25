import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { CalendarServerServiceFixed } from '@/lib/calendar-server-fixed'

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient(request)
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const debugLogs: string[] = []
    const addLog = (message: string) => {
      console.log(`[Calendar Cleanup] ${message}`)
      debugLogs.push(`${new Date().toLocaleTimeString()}: ${message}`)
    }

    addLog('Starting calendar cleanup...')

    // Step 1: Get all user calendars from database
    addLog('Step 1: Checking database for user calendars...')
    const { data: userCalendars, error: dbError } = await supabase
      .from('user_calendars')
      .select('*')
      .eq('user_id', session.user.id)

    if (dbError) {
      addLog(`❌ Database error: ${dbError.message}`)
      return NextResponse.json({
        success: false,
        error: 'Database error',
        debugLogs
      })
    }

    addLog(`Found ${userCalendars?.length || 0} calendars in database`)

    if (!userCalendars || userCalendars.length === 0) {
      addLog('No calendars found in database')
      return NextResponse.json({
        success: true,
        message: 'No calendars to clean up',
        debugLogs
      })
    }

    // Step 2: Get calendar client to access Google Calendar API
    addLog('Step 2: Creating calendar client...')
    const calendar = await CalendarServerServiceFixed.createCalendarClient(session.user.id, supabase)
    if (!calendar) {
      addLog('❌ Failed to create calendar client')
      return NextResponse.json({
        success: false,
        error: 'Failed to create calendar client',
        debugLogs
      })
    }

    // Step 3: Get all calendars from Google Calendar API
    addLog('Step 3: Fetching calendars from Google...')
    const calendarList = await calendar.calendarList.list()
    const googleCalendars = calendarList.data.items || []
    
    addLog(`Found ${googleCalendars.length} calendars in Google Calendar`)

    // Step 4: Find Sentinel calendars
    const sentinelCalendars = googleCalendars.filter(cal => 
      cal.summary?.includes('Sentinel Subscriptions')
    )

    addLog(`Found ${sentinelCalendars.length} Sentinel calendars in Google`)

    // Step 5: Keep the first one, delete the rest
    if (sentinelCalendars.length > 1) {
      addLog('Multiple Sentinel calendars found, keeping the first one...')
      
      const calendarToKeep = sentinelCalendars[0]
      const calendarsToDelete = sentinelCalendars.slice(1)

      addLog(`Keeping calendar: ${calendarToKeep.summary} (${calendarToKeep.id})`)
      addLog(`Will delete ${calendarsToDelete.length} duplicate calendars`)

      let deletedCount = 0
      for (const cal of calendarsToDelete) {
        try {
          addLog(`Deleting calendar: ${cal.summary} (${cal.id})`)
          await calendar.calendars.delete({ calendarId: cal.id! })
          deletedCount++
          addLog(`✅ Deleted calendar: ${cal.summary}`)
        } catch (deleteError) {
          addLog(`❌ Failed to delete calendar ${cal.summary}: ${deleteError}`)
        }
      }

      // Step 6: Update database to only keep the first calendar
      addLog('Step 4: Updating database...')
      
      // Delete all user calendars from database
      const { error: deleteDbError } = await supabase
        .from('user_calendars')
        .delete()
        .eq('user_id', session.user.id)

      if (deleteDbError) {
        addLog(`❌ Error deleting from database: ${deleteDbError.message}`)
      } else {
        addLog('✅ Cleared database entries')
      }

      // Insert the calendar we're keeping
      const { error: insertError } = await supabase
        .from('user_calendars')
        .insert({
          user_id: session.user.id,
          calendar_id: calendarToKeep.id,
          calendar_name: calendarToKeep.summary,
          created_at: new Date().toISOString()
        })

      if (insertError) {
        addLog(`❌ Error inserting calendar to database: ${insertError.message}`)
      } else {
        addLog('✅ Updated database with single calendar')
      }

      addLog(`🎉 Cleanup completed: Deleted ${deletedCount} duplicate calendars`)

      return NextResponse.json({
        success: true,
        message: `Successfully cleaned up ${deletedCount} duplicate calendars`,
        debugLogs,
        keptCalendar: {
          id: calendarToKeep.id,
          summary: calendarToKeep.summary
        },
        deletedCount
      })
    } else {
      addLog('Only one Sentinel calendar found, no cleanup needed')
      return NextResponse.json({
        success: true,
        message: 'No duplicate calendars found',
        debugLogs
      })
    }

  } catch (error) {
    console.error('Error in calendar cleanup:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Failed to cleanup calendars',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 