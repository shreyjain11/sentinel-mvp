import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { CalendarServerService } from '@/lib/calendar-server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient(request)
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const debugLogs: string[] = []
    const addLog = (message: string) => {
      console.log(`[Calendar Integration Test] ${message}`)
      debugLogs.push(`${new Date().toLocaleTimeString()}: ${message}`)
    }

    addLog('Starting comprehensive Google Calendar integration test...')

    // Step 1: Check if user has tokens
    addLog('Step 1: Checking OAuth tokens...')
    const { data: tokens, error: tokenError } = await supabase
      .from('gmail_tokens')
      .select('access_token, refresh_token, scope, expires_at')
      .eq('user_id', session.user.id)
      .single()

    if (tokenError || !tokens) {
      addLog(`❌ No tokens found: ${tokenError?.message || 'No tokens in database'}`)
      return NextResponse.json({
        success: false,
        error: 'No OAuth tokens found',
        debugLogs
      })
    }

    addLog(`✅ Tokens found - Access token: ${tokens.access_token ? 'Present' : 'Missing'}`)
    addLog(`Scope: ${tokens.scope || 'No scope'}`)

    // Step 2: Check calendar scope
    addLog('Step 2: Checking calendar scope...')
    const hasCalendarScope = tokens.scope && 
      tokens.scope.includes('https://www.googleapis.com/auth/calendar')

    if (!hasCalendarScope) {
      addLog('❌ No calendar scope found in tokens')
      return NextResponse.json({
        success: false,
        error: 'No calendar scope in OAuth tokens',
        debugLogs
      })
    }

    addLog('✅ Calendar scope found')

    // Step 3: Test calendar connection
    addLog('Step 3: Testing calendar connection...')
    const isConnected = await CalendarServerService.isCalendarConnected()
    addLog(`Calendar connected: ${isConnected}`)

    if (!isConnected) {
      return NextResponse.json({
        success: false,
        error: 'Calendar not connected',
        debugLogs
      })
    }

    // Step 4: Test creating a calendar client
    addLog('Step 4: Testing calendar client creation...')
    const calendar = await CalendarServerService.createCalendarClient(session.user.id)
    if (!calendar) {
      addLog('❌ Failed to create calendar client')
      return NextResponse.json({
        success: false,
        error: 'Failed to create calendar client',
        debugLogs
      })
    }
    addLog('✅ Calendar client created successfully')

    // Step 5: Test getting or creating user calendar
    addLog('Step 5: Testing user calendar creation...')
    const calendarId = await CalendarServerService.getUserCalendar(session.user.id)
    if (!calendarId) {
      addLog('❌ Failed to get/create user calendar')
      return NextResponse.json({
        success: false,
        error: 'Failed to get/create user calendar',
        debugLogs
      })
    }
    addLog(`✅ User calendar ready: ${calendarId}`)

    // Step 6: Test creating a sample event
    addLog('Step 6: Testing sample event creation...')
    const testDate = new Date()
    testDate.setDate(testDate.getDate() + 7) // 7 days from now
    const testEventId = await CalendarServerService.createSubscriptionEvent(
      'test-subscription-id',
      'Test Subscription',
      testDate.toISOString().split('T')[0],
      'renewal',
      {
        originalEmailSubject: 'Test Email',
        cancelUrl: 'https://example.com/cancel',
        amount: 9.99,
        currency: 'USD'
      }
    )

    if (!testEventId) {
      addLog('❌ Failed to create test calendar event')
      return NextResponse.json({
        success: false,
        error: 'Failed to create test calendar event',
        debugLogs
      })
    }

    addLog(`✅ Test event created successfully: ${testEventId}`)

    // Step 7: Clean up test event
    addLog('Step 7: Cleaning up test event...')
    try {
      await calendar.events.delete({
        calendarId: calendarId,
        eventId: testEventId
      })
      addLog('✅ Test event cleaned up successfully')
    } catch (cleanupError) {
      addLog(`⚠️ Failed to clean up test event: ${cleanupError}`)
      // Don't fail the test for cleanup issues
    }

    addLog('🎉 Google Calendar integration test completed successfully!')

    return NextResponse.json({
      success: true,
      message: 'Google Calendar integration is working correctly',
      debugLogs,
      calendarId,
      testEventId
    })

  } catch (error) {
    console.error('Error in calendar integration test:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Failed to test calendar integration',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 