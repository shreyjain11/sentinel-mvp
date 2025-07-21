'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function TestRedirectPage() {
  const [redirectInfo, setRedirectInfo] = useState<any>(null)

  useEffect(() => {
    // Simulate the exact logic from auth.ts
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    const baseUrl = isLocalhost 
      ? (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
      : window.location.origin
    const redirectTo = `${baseUrl}/auth/callback`

    setRedirectInfo({
      hostname: window.location.hostname,
      origin: window.location.origin,
      href: window.location.href,
      isLocalhost,
      baseUrl,
      redirectTo,
      envAppUrl: process.env.NEXT_PUBLIC_APP_URL,
      timestamp: new Date().toISOString()
    })
  }, [])

  const testOAuth = async () => {
    try {
      const { signInWithGoogle } = await import('@/lib/auth')
      await signInWithGoogle()
    } catch (error) {
      console.error('OAuth test error:', error)
      alert('OAuth test error: ' + error)
    }
  }

  if (!redirectInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading redirect test...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Redirect Logic Test</h1>
          <p className="text-gray-600">Testing the OAuth redirect logic</p>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Current Environment</CardTitle>
              <CardDescription>What the app detects about your current environment</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Hostname</label>
                  <p className="text-sm text-gray-900">{redirectInfo.hostname}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Origin</label>
                  <p className="text-sm text-gray-900">{redirectInfo.origin}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Is Localhost</label>
                  <Badge variant={redirectInfo.isLocalhost ? "destructive" : "default"}>
                    {redirectInfo.isLocalhost ? "Yes" : "No"}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Environment Variable</label>
                  <p className="text-sm text-gray-900 break-all">{redirectInfo.envAppUrl || 'Not set'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Redirect Logic</CardTitle>
              <CardDescription>How the redirect URL is calculated</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Base URL (Calculated)</label>
                <p className="text-sm text-gray-900 break-all font-mono bg-gray-100 p-2 rounded">
                  {redirectInfo.baseUrl}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Final Redirect To</label>
                <p className="text-sm text-gray-900 break-all font-mono bg-blue-100 p-2 rounded">
                  {redirectInfo.redirectTo}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Test OAuth Flow</CardTitle>
              <CardDescription>Test the actual OAuth redirect</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={testOAuth} className="w-full">
                Test Google OAuth Sign In
              </Button>
              <p className="text-sm text-gray-600 mt-2">
                This will initiate the OAuth flow and show you exactly where it redirects.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Raw Data</CardTitle>
              <CardDescription>Complete debug information</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto max-h-64">
                {JSON.stringify(redirectInfo, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 