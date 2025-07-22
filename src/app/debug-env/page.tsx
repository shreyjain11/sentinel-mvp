'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'

export default function DebugEnvPage() {
  const [envInfo, setEnvInfo] = useState<any>({})
  const [supabaseInfo, setSupabaseInfo] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkEnvironment = async () => {
      try {
        // Check environment variables
        const envData = {
          NODE_ENV: process.env.NODE_ENV,
          NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
          NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT SET',
          NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET',
          NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? 'SET' : 'NOT SET',
          VERCEL_URL: process.env.VERCEL_URL,
          VERCEL_ENV: process.env.VERCEL_ENV,
          currentUrl: window.location.href,
          origin: window.location.origin,
          hostname: window.location.hostname
        }

        setEnvInfo(envData)

        // Test Supabase connection
        try {
          const { data: { session }, error } = await supabase.auth.getSession()
          setSupabaseInfo({
            connected: !error,
            error: error?.message,
            hasSession: !!session,
            userEmail: session?.user?.email
          })
        } catch (supabaseError) {
          setSupabaseInfo({
            connected: false,
            error: supabaseError instanceof Error ? supabaseError.message : 'Unknown error'
          })
        }

      } catch (error) {
        console.error('Debug error:', error)
      } finally {
        setLoading(false)
      }
    }

    checkEnvironment()
  }, [])

  const testAuth = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      if (error) {
        alert(`Auth error: ${error.message}`)
      } else {
        alert('Auth initiated successfully')
      }
    } catch (error) {
      alert(`Error: ${error}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div>Loading debug info...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Environment Debug</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>Environment Variables</CardTitle>
            <CardDescription>Check if all required environment variables are set</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(envInfo).map(([key, value]) => (
                <div key={key} className="flex justify-between items-center p-2 bg-gray-100 rounded">
                  <span className="font-mono text-sm">{key}:</span>
                  <span className={`font-mono text-sm ${value === 'NOT SET' ? 'text-red-600' : 'text-green-600'}`}>
                    {typeof value === 'string' && value.length > 50 ? `${value.substring(0, 50)}...` : String(value)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Supabase Connection</CardTitle>
            <CardDescription>Test Supabase client connection</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center p-2 bg-gray-100 rounded">
                <span>Connected:</span>
                <span className={supabaseInfo.connected ? 'text-green-600' : 'text-red-600'}>
                  {supabaseInfo.connected ? 'Yes' : 'No'}
                </span>
              </div>
              {supabaseInfo.error && (
                <div className="flex justify-between items-center p-2 bg-red-100 rounded">
                  <span>Error:</span>
                  <span className="text-red-600 text-sm">{supabaseInfo.error}</span>
                </div>
              )}
              <div className="flex justify-between items-center p-2 bg-gray-100 rounded">
                <span>Has Session:</span>
                <span className={supabaseInfo.hasSession ? 'text-green-600' : 'text-gray-600'}>
                  {supabaseInfo.hasSession ? 'Yes' : 'No'}
                </span>
              </div>
              {supabaseInfo.userEmail && (
                <div className="flex justify-between items-center p-2 bg-gray-100 rounded">
                  <span>User Email:</span>
                  <span className="text-sm">{supabaseInfo.userEmail}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test Authentication</CardTitle>
            <CardDescription>Test the OAuth flow</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={testAuth} className="w-full">
              Test Google OAuth
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Redirect URL Check</CardTitle>
            <CardDescription>Verify the redirect URL being used</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="p-2 bg-blue-100 rounded">
                <strong>Current Redirect URL:</strong><br />
                <code className="text-sm">{`${window.location.origin}/auth/callback`}</code>
              </div>
              <div className="p-2 bg-yellow-100 rounded">
                <strong>Expected in Google Console:</strong><br />
                <code className="text-sm">https://sentinel-mvp.vercel.app/auth/callback</code>
              </div>
              <div className="p-2 bg-yellow-100 rounded">
                <strong>Expected in Supabase:</strong><br />
                <code className="text-sm">https://sentinel-mvp.vercel.app/auth/callback</code>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 