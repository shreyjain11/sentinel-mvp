'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function DebugRedirectPage() {
  const [redirectInfo, setRedirectInfo] = useState<any>(null)

  useEffect(() => {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    const redirectTo = isLocalhost 
      ? 'http://localhost:3000/auth/callback'
      : `${window.location.origin}/auth/callback`

    setRedirectInfo({
      hostname: window.location.hostname,
      origin: window.location.origin,
      href: window.location.href,
      isLocalhost,
      redirectTo,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    })
  }, [])

  const testOAuthRedirect = async () => {
    try {
      const { supabase } = await import('@/lib/supabase')
      
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      const redirectTo = isLocalhost 
        ? 'http://localhost:3000/auth/callback'
        : `${window.location.origin}/auth/callback`

      console.log('Testing OAuth redirect with:', redirectTo)
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      if (error) {
        console.error('OAuth error:', error)
        alert(`OAuth Error: ${error.message}`)
      } else {
        console.log('OAuth initiated:', data)
        alert('OAuth initiated successfully! Check the console for details.')
      }
    } catch (error) {
      console.error('Test error:', error)
      alert(`Test Error: ${error}`)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">OAuth Redirect Debug</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Current Environment</CardTitle>
        </CardHeader>
        <CardContent>
          {redirectInfo ? (
            <div className="space-y-2">
              <div><strong>Hostname:</strong> {redirectInfo.hostname}</div>
              <div><strong>Origin:</strong> {redirectInfo.origin}</div>
              <div><strong>Full URL:</strong> {redirectInfo.href}</div>
              <div><strong>Is Localhost:</strong> {redirectInfo.isLocalhost ? 'Yes' : 'No'}</div>
              <div><strong>Redirect To:</strong> <code className="bg-gray-100 px-2 py-1 rounded">{redirectInfo.redirectTo}</code></div>
              <div><strong>User Agent:</strong> <code className="text-xs bg-gray-100 px-2 py-1 rounded block">{redirectInfo.userAgent}</code></div>
              <div><strong>Timestamp:</strong> {redirectInfo.timestamp}</div>
            </div>
          ) : (
            <div>Loading...</div>
          )}
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Environment Variables</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div><strong>NEXT_PUBLIC_SUPABASE_URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT SET'}</div>
            <div><strong>NEXT_PUBLIC_APP_URL:</strong> {process.env.NEXT_PUBLIC_APP_URL || 'NOT SET'}</div>
            <div><strong>NEXT_PUBLIC_GOOGLE_CLIENT_ID:</strong> {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? 'SET' : 'NOT SET'}</div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Test OAuth Redirect</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={testOAuthRedirect} className="w-full">
            Test Google OAuth Redirect
          </Button>
          <p className="text-sm text-gray-600 mt-2">
            This will initiate the OAuth flow and show you exactly where it's trying to redirect.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Troubleshooting Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2">
            <li>Check if the "Redirect To" URL above matches what you added to Google Cloud Console</li>
            <li>Make sure you added these URLs to Google Cloud Console OAuth settings:
              <ul className="list-disc list-inside ml-4 mt-1">
                <li><code>https://sentinel-mvp.vercel.app/auth/callback</code></li>
                <li><code>https://sentinel-mvp.vercel.app/auth/gmail/callback</code></li>
                <li><code>https://sentinel-mvp.vercel.app/auth/calendar/callback</code></li>
              </ul>
            </li>
            <li>Clear your browser cache and cookies</li>
            <li>Try in an incognito/private window</li>
            <li>Check the browser console for any error messages</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
} 