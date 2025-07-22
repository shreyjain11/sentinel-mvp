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

    // Get all subscriptions with upcoming dates
    const { data: subscriptions, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('status', 'active')
      .or(`renewal_date.gte.${new Date().toISOString().split('T')[0]},trial_end_date.gte.${new Date().toISOString().split('T')[0]}`)
      .order('renewal_date', { ascending: true })

    if (error) {
      console.error('Error fetching subscriptions:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    // Format events
    const events: any[] = []
    subscriptions?.forEach(subscription => {
      // Add renewal event if renewal_date exists and is in the future
      if (subscription.renewal_date && new Date(subscription.renewal_date) > new Date()) {
        events.push({
          id: `renewal-${subscription.id}`,
          title: `${subscription.name} Renewal`,
          description: `Your ${subscription.name} subscription will renew on ${subscription.renewal_date}`,
          start: subscription.renewal_date,
          end: subscription.renewal_date,
          type: 'renewal',
          subscriptionId: subscription.id,
          calendarEventId: subscription.calendar_event_id,
          calendarId: subscription.calendar_id
        })
      }

      // Add trial end event if trial_end_date exists and is in the future
      if (subscription.trial_end_date && new Date(subscription.trial_end_date) > new Date()) {
        events.push({
          id: `trial-${subscription.id}`,
          title: `${subscription.name} Trial Ends`,
          description: `Your ${subscription.name} trial will end on ${subscription.trial_end_date}`,
          start: subscription.trial_end_date,
          end: subscription.trial_end_date,
          type: 'trial_end',
          subscriptionId: subscription.id,
          calendarEventId: subscription.calendar_event_id,
          calendarId: subscription.calendar_id
        })
      }
    })

    return NextResponse.json({
      success: true,
      subscriptions: subscriptions || [],
      events: events,
      eventCount: events.length
    })

  } catch (error) {
    console.error('Error in test events endpoint:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      message: 'Failed to get test events'
    }, { status: 500 })
  }
} 