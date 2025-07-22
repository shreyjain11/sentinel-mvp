import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient(request)
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { subscriptionId, renewalDate } = body

    if (!subscriptionId || !renewalDate) {
      return NextResponse.json({ 
        error: 'Missing required fields',
        details: 'subscriptionId and renewalDate are required'
      }, { status: 400 })
    }

    // Update the subscription with the renewal date
    const { data, error } = await supabase
      .from('subscriptions')
      .update({
        renewal_date: renewalDate,
        updated_at: new Date().toISOString()
      })
      .eq('id', subscriptionId)
      .eq('user_id', session.user.id)
      .select()

    if (error) {
      console.error('Error updating subscription:', error)
      return NextResponse.json({ 
        error: 'Failed to update subscription',
        details: error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Renewal date updated successfully',
      subscription: data?.[0]
    })

  } catch (error) {
    console.error('Error updating renewal date:', error)
    return NextResponse.json({ 
      error: 'Failed to update renewal date',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 