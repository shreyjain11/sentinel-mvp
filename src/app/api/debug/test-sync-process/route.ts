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
      console.log(`[Sync Debug] ${message}`)
      debugLogs.push(`${new Date().toLocaleTimeString()}: ${message}`)
    }

    addLog('Starting comprehensive sync process test...')

    // Step 1: Check calendar connection
    addLog('Step 1: Checking calendar connection...')
    const isConnected = await CalendarServerServiceFixed.isCalendarConnected(supabase)
    addLog(`Calendar connected: ${isConnected}`)

    if (!isConnected) {
      return NextResponse.json({
        success: false,
        error: 'Calendar not connected',
        debugLogs
      })
    }

    // Step 2: Get subscriptions eligible for sync
    addLog('Step 2: Fetching subscriptions eligible for sync...')
    const { data: subscriptions, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', session.user.id)
      .is('calendar_event_id', null)

    if (subError) {
      addLog(`Error fetching subscriptions: ${subError.message}`)
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch subscriptions',
        debugLogs
      })
    }

    addLog(`Found ${subscriptions?.length || 0} subscriptions without calendar events`)

    // Step 3: Filter subscriptions with renewal dates
    const eligibleSubscriptions = subscriptions?.filter(sub => sub.renewal_date) || []
    addLog(`Found ${eligibleSubscriptions.length} subscriptions with renewal dates`)

    if (eligibleSubscriptions.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No subscriptions eligible for sync',
        debugLogs,
        subscriptions: subscriptions || []
      })
    }

    // Step 4: Test creating calendar events for each subscription
    addLog('Step 4: Testing calendar event creation...')
    const results = []

    for (const subscription of eligibleSubscriptions) {
      addLog(`Processing subscription: ${subscription.name} (${subscription.id})`)
      addLog(`Renewal date: ${subscription.renewal_date}`)

      try {
        const eventId = await CalendarServerServiceFixed.createSubscriptionEvent(
          subscription.id,
          subscription.name,
          subscription.renewal_date,
          'renewal',
          supabase,
          {
            originalEmailSubject: subscription.source_email_id,
            cancelUrl: subscription.cancel_url,
            amount: subscription.amount,
            currency: subscription.currency
          }
        )

        if (eventId) {
          addLog(`✅ Successfully created calendar event: ${eventId}`)
          results.push({
            subscriptionId: subscription.id,
            subscriptionName: subscription.name,
            eventId,
            success: true
          })
        } else {
          addLog(`❌ Failed to create calendar event for ${subscription.name}`)
          results.push({
            subscriptionId: subscription.id,
            subscriptionName: subscription.name,
            eventId: null,
            success: false
          })
        }
      } catch (error) {
        addLog(`❌ Error creating event for ${subscription.name}: ${error}`)
        results.push({
          subscriptionId: subscription.id,
          subscriptionName: subscription.name,
          eventId: null,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    const successCount = results.filter(r => r.success).length
    const failureCount = results.filter(r => !r.success).length

    addLog(`Sync process completed: ${successCount} successful, ${failureCount} failed`)

    return NextResponse.json({
      success: successCount > 0,
      message: `Sync process completed: ${successCount} successful, ${failureCount} failed`,
      debugLogs,
      results,
      summary: {
        totalSubscriptions: subscriptions?.length || 0,
        eligibleSubscriptions: eligibleSubscriptions.length,
        successfulEvents: successCount,
        failedEvents: failureCount
      }
    })

  } catch (error) {
    console.error('Error in sync process test:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Failed to test sync process',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 