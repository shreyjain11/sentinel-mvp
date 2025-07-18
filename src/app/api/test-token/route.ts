import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    console.log('=== API Route Session Debug ===')
    
    // Log all cookies
    const cookieHeader = request.headers.get('cookie')
    console.log('Raw cookie header:', cookieHeader)
    
    // Try multiple methods to get session
    const supabase = createSupabaseServerClient(request)
    
    // Method 1: Direct session call
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
    console.log('Session data:', sessionData)
    console.log('Session error:', sessionError)
    
    // Method 2: Try to get user
    const { data: userData, error: userError } = await supabase.auth.getUser()
    console.log('User data:', userData)
    console.log('User error:', userError)
    
    return NextResponse.json({
      success: true,
      hasSession: !!sessionData.session,
      hasUser: !!userData.user,
      sessionError,
      userError,
      cookieLength: cookieHeader?.length || 0
    })
  } catch (error) {
    console.error('Test token error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 