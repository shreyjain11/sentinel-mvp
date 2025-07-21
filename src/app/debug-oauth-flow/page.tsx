'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function DebugOAuthFlowPage() {
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Check if we're on a callback page
    const url = window.location.href
    const hasAccessToken = url.includes('#access_token=')
    const hasCode = url.includes('?code=')
    
    setDebugInfo({
      currentUrl: url,
      hasAccessToken,
      hasCode,
      hostname: window.location.hostname,
      pathname: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash,
      timestamp: new Date().toISOString()
    })
  }, [])

  const testOAuthFlow = async () => {
    setIsLoading(true)
    try {
      const { supabase } = await import('@/lib/supabase')
      
      // Test the OAuth flow with detailed logging
      console.log('Starting OAuth flow test...')
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'https://sentinel-mvp.vercel.app/auth/callback',
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
    } finally {
      setIsLoading(false)
    }
  }

  const checkSupabaseConfig = async () => {
    try {
      const { supabase } = await import('@/lib/supabase')
      
      // Check if we can connect to Supabase
      const { data, error } = await supabase.auth.getSession()
      
      alert(`Supabase connection test:\nData: ${JSON.stringify(data)}\nError: ${error?.message || 'None'}`)
    } catch (error) {
      alert(`Supabase config error: ${error}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">OAuth Flow Debug</h1>
          <p className="text-gray-600">Detailed debugging of the OAuth authentication flow</p>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Current URL Analysis</CardTitle>
              <CardDescription>What the current URL tells us about the OAuth flow</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {debugInfo && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Has Access Token</label>
                      <Badge variant={debugInfo.hasAccessToken ? "default" : "destructive"}>
                        {debugInfo.hasAccessToken ? "Yes" : "No"}
                      </Badge>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Has Code</label>
                      <Badge variant={debugInfo.hasCode ? "default" : "destructive"}>
                        {debugInfo.hasCode ? "Yes" : "No"}
                      </Badge>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Hostname</label>
                      <p className="text-sm text-gray-900">{debugInfo.hostname}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Pathname</label>
                      <p className="text-sm text-gray-900">{debugInfo.pathname}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Full URL</label>
                    <p className="text-sm text-gray-900 break-all font-mono bg-gray-100 p-2 rounded">
                      {debugInfo.currentUrl}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>OAuth Flow Test</CardTitle>
              <CardDescription>Test the complete OAuth flow with detailed logging</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={testOAuthFlow} 
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? 'Testing OAuth Flow...' : 'Test Complete OAuth Flow'}
              </Button>
              <Button 
                onClick={checkSupabaseConfig} 
                variant="outline"
                className="w-full"
              >
                Test Supabase Configuration
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Troubleshooting Steps</CardTitle>
              <CardDescription>What to check if the issue persists</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">1. Check Supabase OAuth Settings</h4>
                  <ul className="list-disc list-inside ml-4 space-y-1 text-gray-700">
                    <li>Go to Supabase Dashboard → Authentication → Settings</li>
                    <li>Check "Site URL" - should be <code>https://sentinel-mvp.vercel.app</code></li>
                    <li>Check "Redirect URLs" - should include <code>https://sentinel-mvp.vercel.app/auth/callback</code></li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">2. Check Google Cloud Console</h4>
                  <ul className="list-disc list-inside ml-4 space-y-1 text-gray-700">
                    <li>Verify all redirect URIs are correctly configured</li>
                    <li>Make sure <code>https://sentinel-mvp.vercel.app/auth/callback</code> is included</li>
                    <li>Check that the OAuth client is enabled</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">3. Check Browser Console</h4>
                  <ul className="list-disc list-inside ml-4 space-y-1 text-gray-700">
                    <li>Open browser developer tools (F12)</li>
                    <li>Go to Console tab</li>
                    <li>Look for any error messages during OAuth flow</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {debugInfo && (
            <Card>
              <CardHeader>
                <CardTitle>Raw Debug Data</CardTitle>
                <CardDescription>Complete debug information</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto max-h-64">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
} 