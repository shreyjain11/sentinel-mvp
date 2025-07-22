import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient(request)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all active subscriptions
    const { data: subscriptions, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching subscriptions for calendar events:', error)
      return NextResponse.json({ events: [] })
    }

    console.log('Found subscriptions:', subscriptions?.length || 0, subscriptions)

    const events: any[] = []

    subscriptions?.forEach(subscription => {
      // Create a renewal event for each active subscription
      // Use end_date if available, otherwise use a default date
      const eventDate = subscription.renewal_date || subscription.end_date || 
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 30 days from now

      events.push({
        id: `renewal-${subscription.id}`,
        title: `${subscription.name} Renewal`,
        description: `Your ${subscription.name} subscription will renew on ${eventDate}`,
        start: eventDate,
        end: eventDate,
        type: 'renewal',
        subscriptionId: subscription.id,
        calendarEventId: subscription.calendar_event_id,
        calendarId: subscription.calendar_id
      })

      // Add trial end event if trial_end_date exists
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

    // Sort by date
    const sortedEvents = events.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())

    console.log('Generated events:', sortedEvents.length, sortedEvents)

    return NextResponse.json({
      success: true,
      events: sortedEvents,
      count: sortedEvents.length,
      subscriptions: subscriptions?.length || 0
    })

  } catch (error) {
    console.error('Error getting upcoming events:', error)
    return NextResponse.json({ 
      events: [],
      error: 'Failed to get events'
    })
  }
} 