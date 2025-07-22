import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient(request)
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({
      id: session.user.id,
      email: session.user.email,
      provider: session.user.app_metadata?.provider || 'unknown',
      created_at: session.user.created_at,
      last_sign_in: session.user.last_sign_in_at
    })

  } catch (error) {
    console.error('Error getting user info:', error)
    return NextResponse.json({ 
      error: 'Failed to get user info',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 