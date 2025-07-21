import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const host = request.headers.get('host') || 'unknown'
    const referer = request.headers.get('referer') || 'unknown'
    
    // Simulate the exact logic from auth.ts
    const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1')
    const baseUrl = isLocalhost 
      ? (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
      : `https://${host}`
    const redirectTo = `${baseUrl}/auth/callback`

    const debugInfo = {
      // Request info
      host,
      referer,
      url: request.url,
      
      // Environment
      isLocalhost,
      envAppUrl: process.env.NEXT_PUBLIC_APP_URL,
      
      // Calculated values
      baseUrl,
      redirectTo,
      
      // All environment variables (for debugging)
      allEnvVars: {
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
        NODE_ENV: process.env.NODE_ENV,
        VERCEL_URL: process.env.VERCEL_URL,
        VERCEL_ENV: process.env.VERCEL_ENV,
      },
      
      timestamp: new Date().toISOString()
    }

    return NextResponse.json(debugInfo)
  } catch (error) {
    return NextResponse.json({ 
      error: 'Debug failed', 
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 