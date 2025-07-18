import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    console.log('Token refresh API route called')
    
    // Create server-side Supabase client
    const supabase = createSupabaseServerClient(request)
    
    // Get session from request
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session) {
      console.error('No session found in refresh token route')
      return NextResponse.json({ error: 'User must be authenticated' }, { status: 401 })
    }

    console.log('Session found for token refresh:', session.user.id)

    // Get the refresh token from the database
    const { data: tokenData, error: tokenError } = await supabase
      .from('gmail_tokens')
      .select('refresh_token')
      .eq('user_id', session.user.id)
      .single()

    if (tokenError || !tokenData?.refresh_token) {
      console.error('No refresh token found:', tokenError)
      return NextResponse.json({ error: 'No refresh token found' }, { status: 404 })
    }

    console.log('Attempting to refresh token...')

    // Use server-side environment variables for token refresh
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      console.error('Google OAuth credentials not configured')
      return NextResponse.json({ error: 'Google OAuth not configured' }, { status: 500 })
    }

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: tokenData.refresh_token,
        grant_type: 'refresh_token',
      }),
    })

    const data = await response.json()
    
    console.log('Token refresh response:', {
      status: response.status,
      ok: response.ok,
      error: data.error,
      hasAccessToken: !!data.access_token
    })
    
    if (!response.ok) {
      console.error('Token refresh failed:', data)
      return NextResponse.json({ 
        error: `Token refresh failed: ${data.error}`,
        details: data.error_description 
      }, { status: 400 })
    }

    // Update stored tokens in database
    const expiresAt = Date.now() + (data.expires_in * 1000)
    const { error: updateError } = await supabase
      .from('gmail_tokens')
      .update({
        access_token: data.access_token,
        expires_at: new Date(expiresAt).toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', session.user.id)

    if (updateError) {
      console.error('Error updating tokens:', updateError)
      return NextResponse.json({ error: 'Failed to update tokens' }, { status: 500 })
    }

    console.log('Token successfully refreshed and updated')

    return NextResponse.json({ 
      access_token: data.access_token,
      expires_at: new Date(expiresAt).toISOString()
    })
  } catch (error) {
    console.error('Token refresh exception:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 