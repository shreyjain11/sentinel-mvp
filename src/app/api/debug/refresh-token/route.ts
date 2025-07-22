import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient(request)
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current tokens
    const { data: tokens, error: tokenError } = await supabase
      .from('gmail_tokens')
      .select('refresh_token, expires_at')
      .eq('user_id', session.user.id)
      .single()

    if (tokenError || !tokens) {
      return NextResponse.json({ 
        success: false,
        error: 'No tokens found',
        details: tokenError?.message || 'No tokens in database'
      })
    }

    if (!tokens.refresh_token) {
      return NextResponse.json({ 
        success: false,
        error: 'No refresh token available'
      })
    }

    // Check if token is actually expired
    const isExpired = tokens.expires_at && new Date(tokens.expires_at) <= new Date()
    
    if (!isExpired) {
      return NextResponse.json({ 
        success: true,
        message: 'Token not expired, no refresh needed',
        expiresAt: tokens.expires_at
      })
    }

    // Attempt to refresh the token
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      return NextResponse.json({ 
        success: false,
        error: 'Missing Google OAuth credentials'
      })
    }

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: tokens.refresh_token,
        grant_type: 'refresh_token',
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      return NextResponse.json({ 
        success: false,
        error: 'Token refresh failed',
        status: response.status,
        details: errorData
      })
    }

    const data = await response.json()
    
    // Update tokens in database
    const { error: updateError } = await supabase
      .from('gmail_tokens')
      .update({
        access_token: data.access_token,
        expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', session.user.id)

    if (updateError) {
      return NextResponse.json({ 
        success: false,
        error: 'Failed to update refreshed tokens',
        details: updateError.message
      })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Token refreshed successfully',
      newExpiresAt: new Date(Date.now() + data.expires_in * 1000).toISOString()
    })

  } catch (error) {
    console.error('Error refreshing token:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Failed to refresh token',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 