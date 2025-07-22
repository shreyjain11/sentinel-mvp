import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient(request)
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get tokens from database
    const { data: tokens, error } = await supabase
      .from('gmail_tokens')
      .select('*')
      .eq('user_id', session.user.id)
      .single()

    if (error) {
      console.error('Error fetching tokens:', error)
      return NextResponse.json({ 
        error: 'No tokens found',
        details: error.message
      })
    }

    if (!tokens) {
      return NextResponse.json({ 
        error: 'No tokens found for user',
        user_id: session.user.id
      })
    }

    return NextResponse.json({
      access_token: tokens.access_token ? 'present' : null,
      refresh_token: tokens.refresh_token ? 'present' : null,
      expires_at: tokens.expires_at,
      scope: tokens.scope,
      user_id: tokens.user_id,
      created_at: tokens.created_at,
      updated_at: tokens.updated_at
    })

  } catch (error) {
    console.error('Error getting tokens:', error)
    return NextResponse.json({ 
      error: 'Failed to get tokens',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 