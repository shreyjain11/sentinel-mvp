import { NextRequest, NextResponse } from 'next/server'
import { SubscriptionService } from '@/lib/subscriptions'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    // Get the current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const body = await request.json()
    
    // Test subscription data
    const testSubscription = {
      name: body.service_name || 'Test Service',
      service: body.service_name || 'Test Service',
      type: (body.status === 'trial' ? 'trial' : 'subscription') as 'trial' | 'subscription',
      status: (body.status === 'trial' ? 'active' : body.status || 'active') as 'active' | 'cancelled' | 'expired',
      amount: body.amount ? parseFloat(body.amount) : undefined,
      currency: 'USD',
      billing_cycle: (body.frequency || 'monthly') as 'daily' | 'weekly' | 'monthly' | 'yearly',
      start_date: body.start_date || new Date().toISOString().split('T')[0],
      end_date: body.renewal_date || new Date().toISOString().split('T')[0],
      renewal_date: body.renewal_date || undefined,
      trial_end_date: body.trial_end_date || undefined,
      auto_renew: body.status === 'active',
      category: body.category || 'Other',
      notes: body.notes || '',
      created_by: 'manual' as const
    }

    console.log('Creating test subscription:', testSubscription)

    const result = await SubscriptionService.createSubscription(userId, testSubscription)
    
    if (result) {
      return NextResponse.json({ 
        success: true, 
        subscription: result,
        message: 'Test subscription created successfully'
      })
    } else {
      return NextResponse.json({ 
        error: 'Failed to create subscription' 
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Error in test subscription creation:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    // Get the current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    
    // Get user's subscriptions
    const subscriptions = await SubscriptionService.getSubscriptions(userId)
    
    return NextResponse.json({ 
      success: true, 
      subscriptions,
      count: subscriptions.length
    })
  } catch (error) {
    console.error('Error fetching subscriptions:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 