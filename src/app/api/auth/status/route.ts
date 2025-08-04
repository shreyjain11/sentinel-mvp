import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Check if user has active session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
    }
    
    if (sessionError) {
      console.error('Session error:', sessionError)
      return NextResponse.json({ 
        authenticated: false,
        error: 'Session error'
      }, { 
        status: 401,
        headers: corsHeaders
      })
    }

    if (!session) {
      return NextResponse.json({ 
        authenticated: false,
        message: 'No active session'
      }, {
        headers: corsHeaders
      })
    }

    // Return minimal user info for extension
    return NextResponse.json({ 
      authenticated: true,
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.user_metadata?.name || session.user.email?.split('@')[0]
      },
      session_expires: session.expires_at,
      dashboard_url: '/dashboard'
    }, {
      headers: corsHeaders
    })
  } catch (error) {
    console.error('Auth status check error:', error)
    return NextResponse.json({ 
      authenticated: false,
      error: 'Internal server error'
    }, { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    })
  }
}

// CORS headers for extension requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}