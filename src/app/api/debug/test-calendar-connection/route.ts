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
      console.log(`[Calendar Connection Test] ${message}`)
      debugLogs.push(`${new Date().toLocaleTimeString()}: ${message}`)
    }

    addLog('Starting calendar connection test...')

    // Step 1: Check basic connection status
    addLog('Step 1: Checking basic connection status...')
    const isConnected = await CalendarServerServiceFixed.isCalendarConnected(supabase)
    addLog(`Basic connection check: ${isConnected}`)

    // Step 2: Try to create a calendar client
    addLog('Step 2: Testing calendar client creation...')
    addLog(`User ID: ${session.user.id}`)
    
    let calendar: any = null
    
    try {
      addLog('Calling createCalendarClient...')
      calendar = await CalendarServerServiceFixed.createCalendarClient(session.user.id, supabase)
      addLog(`createCalendarClient returned: ${calendar ? 'success' : 'null'}`)
      
      if (!calendar) {
        addLog('❌ Failed to create calendar client - returned null')
        return NextResponse.json({
          success: false,
          error: 'Failed to create calendar client',
          debugLogs
        })
      }
      addLog('✅ Calendar client created successfully')
    } catch (calendarError) {
      addLog(`❌ Exception in createCalendarClient: ${calendarError}`)
      addLog(`Error details: ${calendarError instanceof Error ? calendarError.message : 'Unknown error'}`)
      return NextResponse.json({
        success: false,
        error: 'Exception creating calendar client',
        details: calendarError instanceof Error ? calendarError.message : 'Unknown error',
        debugLogs
      })
    }

    // Step 3: Test getting user calendar
    addLog('Step 3: Testing user calendar access...')
    const calendarId = await CalendarServerServiceFixed.getUserCalendar(session.user.id, supabase)
    if (!calendarId) {
      addLog('❌ Failed to get/create user calendar')
      return NextResponse.json({
        success: false,
        error: 'Failed to get/create user calendar',
        debugLogs
      })
    }
    addLog(`✅ User calendar ready: ${calendarId}`)

    // Step 4: Test calendar API access
    addLog('Step 4: Testing calendar API access...')
    try {
      const calendarList = await calendar.calendarList.list()
      addLog(`✅ Calendar API access confirmed - Found ${calendarList.data.items?.length || 0} calendars`)
    } catch (apiError) {
      addLog(`❌ Calendar API access failed: ${apiError}`)
      return NextResponse.json({
        success: false,
        error: 'Calendar API access failed',
        details: apiError instanceof Error ? apiError.message : 'Unknown error',
        debugLogs
      })
    }

    addLog('🎉 Calendar connection test completed successfully!')

    return NextResponse.json({
      success: true,
      message: 'Calendar connection is working correctly',
      debugLogs,
      calendarId
    })

  } catch (error) {
    console.error('Error in calendar connection test:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Failed to test calendar connection',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 