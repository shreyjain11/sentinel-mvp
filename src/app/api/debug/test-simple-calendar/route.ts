import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { google } from 'googleapis'

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient(request)
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const debugLogs: string[] = []
    const addLog = (message: string) => {
      console.log(`[Simple Calendar Test] ${message}`)
      debugLogs.push(`${new Date().toLocaleTimeString()}: ${message}`)
    }

    addLog('Starting simple calendar test...')

    // Step 1: Get tokens directly
    addLog('Step 1: Getting tokens from database...')
    const { data: tokens, error: tokenError } = await supabase
      .from('gmail_tokens')
      .select('access_token, refresh_token, expires_at, scope')
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
    addLog(`Expires at: ${tokens.expires_at}`)

    // Step 2: Check if token is expired
    const isExpired = tokens.expires_at && new Date(tokens.expires_at) <= new Date()
    addLog(`Token expired: ${isExpired}`)

    if (isExpired) {
      addLog('❌ Token is expired, cannot proceed without refresh')
      return NextResponse.json({
        success: false,
        error: 'Token is expired',
        debugLogs
      })
    }

    // Step 3: Try to create a simple calendar client
    addLog('Step 3: Creating simple calendar client...')
    try {
      const auth = new google.auth.OAuth2()
      auth.setCredentials({
        access_token: tokens.access_token
      })

      const calendar = google.calendar({ version: 'v3', auth })
      addLog('✅ Simple calendar client created')

      // Step 4: Test a simple API call
      addLog('Step 4: Testing simple API call...')
      const calendarList = await calendar.calendarList.list()
      addLog(`✅ API call successful - Found ${calendarList.data.items?.length || 0} calendars`)

      return NextResponse.json({
        success: true,
        message: 'Simple calendar test successful',
        debugLogs,
        calendarCount: calendarList.data.items?.length || 0
      })

    } catch (apiError) {
      addLog(`❌ API call failed: ${apiError}`)
      return NextResponse.json({
        success: false,
        error: 'Calendar API call failed',
        details: apiError instanceof Error ? apiError.message : 'Unknown error',
        debugLogs
      })
    }

  } catch (error) {
    console.error('Error in simple calendar test:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Failed to test calendar',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 