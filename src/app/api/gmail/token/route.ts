import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const { code, state, scope } = await request.json()
    const isCalendarScope = scope === 'calendar'

    // Get the authorization header which should contain the session
    const authHeader = request.headers.get('authorization')
    const cookieHeader = request.headers.get('cookie')
    
    console.log('API Route Debug:', {
      hasAuthHeader: !!authHeader,
      hasCookieHeader: !!cookieHeader,
      cookieLength: cookieHeader?.length || 0
    })

    // Create server-side Supabase client with proper cookie handling
    const supabase = createSupabaseServerClient(request)
    
    // Try to get session directly - Supabase should handle cookies automatically
    let session = null
    
    // Try to get session directly - Supabase should handle cookies automatically
    const { data: { session: directSession }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError) {
      console.error('Session error:', sessionError)
      return NextResponse.json({ error: `Session error: ${sessionError.message}` }, { status: 401 })
    }
    session = directSession
    if (session) {
      console.log('Session found directly:', session.user.id)
    }

    if (!session) {
      console.error('No session found in API route')
      return NextResponse.json({ error: 'User must be authenticated first' }, { status: 401 })
    }

    console.log('Session found in API route:', {
      userId: session.user.id,
      email: session.user.email
    })

    // Decode state to get original user ID (only required for Gmail, not Calendar)
    if (!isCalendarScope && state) {
    let decodedState
    try {
      decodedState = JSON.parse(Buffer.from(state, 'base64').toString())
    } catch (error) {
      console.error('Failed to decode state:', error)
      return NextResponse.json({ error: 'Invalid OAuth state format' }, { status: 400 })
    }

    if (decodedState.userId !== session.user.id) {
      console.error('Invalid OAuth state - user mismatch:', {
        expectedUserId: decodedState.userId,
        currentUserId: session.user.id
      })
      return NextResponse.json({ error: 'Invalid OAuth state - user mismatch' }, { status: 400 })
      }
    }

    // Exchange code for tokens using server-side environment variables
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    
    // Use the environment variable for the base URL to ensure consistency
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const redirectUri = isCalendarScope 
      ? `${baseUrl}/auth/calendar/callback`
      : `${baseUrl}/auth/gmail/callback`

    if (!clientId || !clientSecret) {
      return NextResponse.json({ error: 'Google OAuth not configured' }, { status: 500 })
    }

    console.log('Server-side token exchange:', {
      clientIdExists: !!clientId,
      clientSecretExists: !!clientSecret,
      redirectUri,
      baseUrl,
      codeLength: code?.length || 0,
      userId: session.user.id
    })

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    })

    const tokenData = await tokenResponse.json()
    
    console.log('Token response:', {
      status: tokenResponse.status,
      ok: tokenResponse.ok,
      error: tokenData.error,
      errorDescription: tokenData.error_description,
      hasAccessToken: !!tokenData.access_token
    })
    
    if (!tokenResponse.ok) {
      console.error('Token exchange failed:', {
        status: tokenResponse.status,
        error: tokenData.error,
        description: tokenData.error_description,
        redirectUri,
        clientId: clientId?.substring(0, 20) + '...'
      })
      return NextResponse.json({ 
        error: `Token exchange failed: ${tokenData.error}`,
        details: tokenData.error_description 
      }, { status: 400 })
    }

    // Store tokens in Supabase
    const expiresAt = Date.now() + (tokenData.expires_in * 1000)
    
    // Determine the scope to store based on the request
    let scopeToStore = 'https://www.googleapis.com/auth/gmail.readonly'
    if (isCalendarScope) {
      // For calendar requests, store both Gmail and Calendar scopes
      scopeToStore = 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/calendar'
    } else if (tokenData.scope) {
      // Use the actual scope returned by Google if available
      scopeToStore = tokenData.scope
    }
    
    console.log('Attempting to store tokens:', {
      userId: session.user.id,
      hasAccessToken: !!tokenData.access_token,
      hasRefreshToken: !!tokenData.refresh_token,
      expiresAt: new Date(expiresAt).toISOString(),
      scope: scopeToStore,
      isCalendarScope
    })
    
    // Check if user already has tokens
    const { data: existingToken } = await supabase
      .from('gmail_tokens')
      .select('refresh_token, access_token, scope')
      .eq('user_id', session.user.id)
      .single()

    console.log('Existing token check:', {
      hasExistingToken: !!existingToken,
      existingScope: existingToken?.scope
    })

    // Prepare the data to store
    const tokenDataToStore: any = {
        user_id: session.user.id,
        access_token: tokenData.access_token,
        expires_at: new Date(expiresAt).toISOString(),
      scope: scopeToStore,
        updated_at: new Date().toISOString()
    }

    // Handle refresh token - always provide a valid value
    if (tokenData.refresh_token) {
      tokenDataToStore.refresh_token = tokenData.refresh_token
    } else if (existingToken?.refresh_token) {
      // Keep existing refresh token if no new one provided
      tokenDataToStore.refresh_token = existingToken.refresh_token
    } else {
      // If no refresh token available, use a placeholder
      tokenDataToStore.refresh_token = 'calendar_only_no_refresh_token'
      console.log('No refresh token available - using placeholder')
    }
    
    console.log('Token storage data:', {
      userId: session.user.id,
      hasAccessToken: !!tokenDataToStore.access_token,
      hasRefreshToken: !!tokenDataToStore.refresh_token,
      scope: tokenDataToStore.scope,
      isCalendarScope
    })
    
    const { data: upsertData, error: dbError } = await supabase
      .from('gmail_tokens')
      .upsert(tokenDataToStore, { 
        onConflict: 'user_id',
        ignoreDuplicates: false 
      })
      .select()

    if (dbError) {
      console.error('Error storing Gmail tokens:', {
        error: dbError,
        code: dbError.code,
        message: dbError.message,
        details: dbError.details,
        hint: dbError.hint,
        dataBeingStored: {
          userId: session.user.id,
          hasAccessToken: !!tokenDataToStore.access_token,
          hasRefreshToken: !!tokenDataToStore.refresh_token,
          accessTokenLength: tokenDataToStore.access_token?.length || 0,
          refreshTokenLength: tokenDataToStore.refresh_token?.length || 0,
          scope: tokenDataToStore.scope
        }
      })
      return NextResponse.json({ 
        error: 'Failed to store tokens',
        details: dbError.message,
        code: dbError.code,
        hint: dbError.hint
      }, { status: 500 })
    }

    console.log('Tokens stored successfully:', {
      userId: session.user.id,
      recordId: upsertData?.[0]?.id
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Token exchange error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 