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
      console.log(`[Simple Sync Test] ${message}`)
      debugLogs.push(`${new Date().toLocaleTimeString()}: ${message}`)
    }

    addLog('Starting simple sync test...')

    // Step 1: Get subscriptions that need syncing
    addLog('Step 1: Getting subscriptions without calendar events...')
    const { data: subscriptions, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', session.user.id)
      .is('calendar_event_id', null)

    if (subError) {
      addLog(`❌ Error fetching subscriptions: ${subError.message}`)
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch subscriptions',
        debugLogs
      })
    }

    addLog(`Found ${subscriptions?.length || 0} subscriptions without calendar events`)

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No subscriptions found without calendar events',
        debugLogs
      })
    }

    // Step 2: Try to sync the first subscription
    const firstSub = subscriptions[0]
    addLog(`Step 2: Testing sync for subscription: ${firstSub.name}`)
    addLog(`Renewal date: ${firstSub.renewal_date}`)

    try {
      const eventId = await CalendarServerService.createSubscriptionEvent(
        firstSub.id,
        firstSub.name,
        firstSub.renewal_date,
        'renewal',
        {
          originalEmailSubject: firstSub.source_email_id,
          cancelUrl: firstSub.cancel_url,
          amount: firstSub.amount,
          currency: firstSub.currency
        }
      )

      if (eventId) {
        addLog(`✅ Successfully created calendar event: ${eventId}`)
        
        // Update the subscription with the event ID
        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({
            calendar_event_id: eventId,
            updated_at: new Date().toISOString()
          })
          .eq('id', firstSub.id)

        if (updateError) {
          addLog(`⚠️ Warning: Failed to update subscription with event ID: ${updateError.message}`)
        } else {
          addLog(`✅ Updated subscription with calendar event ID`)
        }

        return NextResponse.json({
          success: true,
          message: `Successfully synced ${firstSub.name} to Google Calendar`,
          eventId,
          debugLogs
        })
      } else {
        addLog(`❌ Failed to create calendar event for ${firstSub.name}`)
        return NextResponse.json({
          success: false,
          error: 'Failed to create calendar event',
          debugLogs
        })
      }
    } catch (error) {
      addLog(`❌ Error creating event: ${error}`)
      return NextResponse.json({
        success: false,
        error: 'Error creating calendar event',
        details: error instanceof Error ? error.message : 'Unknown error',
        debugLogs
      })
    }

  } catch (error) {
    console.error('Error in simple sync test:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Failed to test sync',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 