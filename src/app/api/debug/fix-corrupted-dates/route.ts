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

    // Validate the date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(renewalDate)) {
      return NextResponse.json({ 
        error: 'Invalid date format',
        details: 'Date must be in YYYY-MM-DD format'
      }, { status: 400 })
    }

    // Validate the date is reasonable (not in the past or too far in the future)
    const inputDate = new Date(renewalDate)
    const now = new Date()
    const maxDate = new Date()
    maxDate.setFullYear(maxDate.getFullYear() + 10) // 10 years from now

    if (inputDate < now) {
      return NextResponse.json({ 
        error: 'Invalid date',
        details: 'Renewal date cannot be in the past'
      }, { status: 400 })
    }

    if (inputDate > maxDate) {
      return NextResponse.json({ 
        error: 'Invalid date',
        details: 'Renewal date cannot be more than 10 years in the future'
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
      message: 'Renewal date fixed successfully',
      subscription: data?.[0]
    })

  } catch (error) {
    console.error('Error fixing renewal date:', error)
    return NextResponse.json({ 
      error: 'Failed to fix renewal date',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 