import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function PUT(request: NextRequest) {
  try {
    const { notification_email } = await request.json()

    if (!notification_email) {
      return NextResponse.json(
        { success: false, message: 'Notification email is required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/
    if (!emailRegex.test(notification_email)) {
      return NextResponse.json(
        { success: false, message: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Get the authenticated user
    const supabase = createSupabaseServerClient(request)
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('Session error:', sessionError)
      return NextResponse.json(
        { success: false, message: 'Session error' },
        { status: 401 }
      )
    }
    
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'User not authenticated' },
        { status: 401 }
      )
    }

    // Update notification preferences
    const { error } = await supabase
      .from('notification_preferences')
      .upsert({
        user_id: session.user.id,
        notification_email: notification_email
      }, {
        onConflict: 'user_id'
      })

    if (error) {
      console.error('Error updating notification email:', error)
      return NextResponse.json(
        { success: false, message: 'Failed to update notification email' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Notification email updated successfully',
      notification_email: notification_email
    })

  } catch (error) {
    console.error('Error updating notification email:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get the authenticated user
    const supabase = createSupabaseServerClient(request)
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('Session error:', sessionError)
      return NextResponse.json(
        { success: false, message: 'Session error' },
        { status: 401 }
      )
    }
    
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'User not authenticated' },
        { status: 401 }
      )
    }

    // Get current notification email
    const { data: preferences, error } = await supabase
      .from('notification_preferences')
      .select('notification_email')
      .eq('user_id', session.user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching notification email:', error)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch notification email' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      notification_email: preferences?.notification_email || session.user.email,
      auth_email: session.user.email
    })

  } catch (error) {
    console.error('Error fetching notification email:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
} 