import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      return NextResponse.json({ 
        authenticated: false, 
        error: error.message 
      })
    }

    if (!session) {
      return NextResponse.json({ 
        authenticated: false, 
        message: 'No active session' 
      })
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.user_metadata?.full_name || session.user.user_metadata?.name
      },
      session: {
        expires_at: session.expires_at,
        refresh_token: !!session.refresh_token
      }
    })
  } catch (error) {
    console.error('Auth status check error:', error)
    return NextResponse.json({ 
      authenticated: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
} 