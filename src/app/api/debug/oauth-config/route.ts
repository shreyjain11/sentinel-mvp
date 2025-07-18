import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    
    return NextResponse.json({
      hasClientId: !!clientId,
      clientIdLength: clientId?.length || 0,
      clientIdPrefix: clientId?.substring(0, 20) || '',
      clientIdSuffix: clientId?.endsWith('.apps.googleusercontent.com') || false,
      hasClientSecret: !!clientSecret,
      clientSecretLength: clientSecret?.length || 0,
      clientSecretPrefix: clientSecret?.substring(0, 10) || '',
      appUrl: process.env.NEXT_PUBLIC_APP_URL,
      environment: process.env.NODE_ENV
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to check config' }, { status: 500 })
  }
} 