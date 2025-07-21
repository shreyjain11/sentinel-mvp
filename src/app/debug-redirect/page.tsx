'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'

export default function DebugRedirectPage() {
  const [debugInfo, setDebugInfo] = useState<any>({})
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const gatherDebugInfo = async () => {
      const info = {
        // Current location info
        currentUrl: window.location.href,
        origin: window.location.origin,
        hostname: window.location.hostname,
        protocol: window.location.protocol,
        port: window.location.port,
        
        // Environment variables (client-side)
        nextPublicAppUrl: process.env.NEXT_PUBLIC_APP_URL,
        
        // Redirect logic
        isLocalhost: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
        calculatedRedirectTo: (() => {
          const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
          return isLocalhost 
            ? 'http://localhost:3000/auth/callback'
            : `${window.location.origin}/auth/callback`
        })(),
        
        // User agent
        userAgent: navigator.userAgent,
        
        // Timestamp
        timestamp: new Date().toISOString()
      }
      
      setDebugInfo(info)
      setIsLoading(false)
    }

    gatherDebugInfo()
  }, [])

  const testRedirect = async () => {
    try {
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      const redirectTo = isLocalhost 
        ? 'http://localhost:3000/auth/callback'
        : `${window.location.origin}/auth/callback`
      
      console.log('Testing redirect to:', redirectTo)
      
      // Test the redirect logic
      const testUrl = new URL(redirectTo)
      console.log('Test URL object:', testUrl)
      
      alert(`Redirect test:\nFrom: ${window.location.origin}\nTo: ${redirectTo}\nIs localhost: ${isLocalhost}`)
    } catch (error) {
      console.error('Redirect test error:', error)
      alert('Error testing redirect: ' + error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading debug information...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Redirect Debug Information</h1>
          <p className="text-gray-600">Debugging the localhost redirect issue</p>
        </div>

        <div className="grid gap-6">
          {/* Current Environment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Current Environment
              </CardTitle>
              <CardDescription>Current location and environment details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Current URL</label>
                  <p className="text-sm text-gray-900 break-all">{debugInfo.currentUrl}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Origin</label>
                  <p className="text-sm text-gray-900">{debugInfo.origin}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Hostname</label>
                  <p className="text-sm text-gray-900">{debugInfo.hostname}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Protocol</label>
                  <p className="text-sm text-gray-900">{debugInfo.protocol}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Port</label>
                  <p className="text-sm text-gray-900">{debugInfo.port || 'default'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Is Localhost</label>
                  <Badge variant={debugInfo.isLocalhost ? "destructive" : "default"}>
                    {debugInfo.isLocalhost ? "Yes" : "No"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Environment Variables */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Environment Variables
              </CardTitle>
              <CardDescription>Client-side environment variables</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <label className="text-sm font-medium text-gray-700">NEXT_PUBLIC_APP_URL</label>
                  <p className="text-sm text-gray-900 break-all">
                    {debugInfo.nextPublicAppUrl || 'Not set'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Redirect Logic */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Redirect Logic
              </CardTitle>
              <CardDescription>How the redirect URL is calculated</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Calculated Redirect To</label>
                <p className="text-sm text-gray-900 break-all font-mono bg-gray-100 p-2 rounded">
                  {debugInfo.calculatedRedirectTo}
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button onClick={testRedirect} variant="outline">
                  Test Redirect Logic
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Analysis
              </CardTitle>
              <CardDescription>What this means for your redirect issue</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {debugInfo.isLocalhost ? (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      You're currently on localhost, so the redirect will go to localhost:3000. 
                      This is expected behavior for local development.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      You're on a production domain ({debugInfo.hostname}), so the redirect should go to {debugInfo.origin}/auth/callback.
                      If you're still seeing localhost redirects, it might be a browser cache issue.
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Troubleshooting Steps:</h4>
                  <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                    <li>Clear your browser cache and cookies</li>
                    <li>Try opening the app in an incognito/private window</li>
                    <li>Check if you have any browser extensions that might be interfering</li>
                    <li>Verify that the environment variables are correctly set in Vercel</li>
                    <li>Make sure you're accessing the correct Vercel URL</li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Raw Debug Data */}
          <Card>
            <CardHeader>
              <CardTitle>Raw Debug Data</CardTitle>
              <CardDescription>Complete debug information for troubleshooting</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto max-h-64">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 