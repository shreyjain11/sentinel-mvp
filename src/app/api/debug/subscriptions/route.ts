import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient(request)
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all subscriptions for the user
    const { data: subscriptions, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching subscriptions:', error)
      return NextResponse.json({ 
        error: 'Failed to fetch subscriptions',
        details: error.message
      }, { status: 500 })
    }

    // Analyze subscriptions for sync
    const analysis = {
      total: subscriptions?.length || 0,
      active: subscriptions?.filter(s => s.status === 'active').length || 0,
      withCalendarEvents: subscriptions?.filter(s => s.calendar_event_id).length || 0,
      withoutCalendarEvents: subscriptions?.filter(s => !s.calendar_event_id).length || 0,
      withRenewalDates: subscriptions?.filter(s => s.renewal_date).length || 0,
      withTrialEndDates: subscriptions?.filter(s => s.trial_end_date).length || 0,
      eligibleForSync: subscriptions?.filter(s => 
        s.status === 'active' && 
        !s.calendar_event_id && 
        (s.renewal_date || s.trial_end_date)
      ).length || 0
    }

    return NextResponse.json({
      subscriptions: subscriptions || [],
      analysis,
      syncEligible: analysis.eligibleForSync > 0
    })

  } catch (error) {
    console.error('Error getting subscriptions:', error)
    return NextResponse.json({ 
      error: 'Failed to get subscriptions',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 