'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function TestSupabaseOAuthPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [debugInfo, setDebugInfo] = useState<any>(null)

  const testSupabaseOAuth = async () => {
    setIsLoading(true)
    try {
      // First, let's check what our debug API says
      const debugResponse = await fetch('/api/debug-oauth-redirect')
      const debugData = await debugResponse.json()
      setDebugInfo(debugData)

      // Now test the actual OAuth flow
      const { supabase } = await import('@/lib/supabase')
      
      // Use a hardcoded redirect URL to test if Supabase is overriding it
      const testRedirectUrl = 'https://sentinel-mvp.vercel.app/auth/callback'
      
      console.log('Testing OAuth with hardcoded redirect:', testRedirectUrl)
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: testRedirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      if (error) {
        console.error('Supabase OAuth error:', error)
        alert(`OAuth Error: ${error.message}`)
      } else {
        console.log('OAuth initiated:', data)
        alert('OAuth initiated successfully! Check the console and see where it redirects.')
      }
    } catch (error) {
      console.error('Test error:', error)
      alert(`Test Error: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Supabase OAuth Test</h1>
          <p className="text-gray-600">Testing if Supabase is overriding our redirect URL</p>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Test with Hardcoded Redirect</CardTitle>
              <CardDescription>
                This test uses a hardcoded redirect URL to see if Supabase is overriding it
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={testSupabaseOAuth} 
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? 'Testing...' : 'Test OAuth with Hardcoded Redirect'}
              </Button>
              <p className="text-sm text-gray-600 mt-2">
                This will use the hardcoded URL: <code>https://sentinel-mvp.vercel.app/auth/callback</code>
              </p>
            </CardContent>
          </Card>

          {debugInfo && (
            <Card>
              <CardHeader>
                <CardTitle>Debug Information</CardTitle>
                <CardDescription>Server-side environment and redirect logic</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Host</label>
                    <p className="text-sm text-gray-900">{debugInfo.host}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Is Localhost</label>
                    <Badge variant={debugInfo.isLocalhost ? "destructive" : "default"}>
                      {debugInfo.isLocalhost ? "Yes" : "No"}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Environment Variable</label>
                    <p className="text-sm text-gray-900 break-all">{debugInfo.envAppUrl || 'Not set'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Calculated Base URL</label>
                    <p className="text-sm text-gray-900 break-all">{debugInfo.baseUrl}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Calculated Redirect To</label>
                    <p className="text-sm text-gray-900 break-all">{debugInfo.redirectTo}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Troubleshooting Steps</CardTitle>
              <CardDescription>What to check if the issue persists</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p><strong>1. Check Supabase Dashboard:</strong></p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Go to Authentication → Settings</li>
                  <li>Look for "Site URL" or "Redirect URLs"</li>
                  <li>Make sure it's set to <code>https://sentinel-mvp.vercel.app</code></li>
                </ul>
                
                <p><strong>2. Check Google Cloud Console:</strong></p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Verify all redirect URIs are correctly configured</li>
                  <li>Make sure <code>https://sentinel-mvp.vercel.app/auth/callback</code> is included</li>
                </ul>
                
                <p><strong>3. Clear Browser Cache:</strong></p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Try in an incognito/private window</li>
                  <li>Clear cookies and cache</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 