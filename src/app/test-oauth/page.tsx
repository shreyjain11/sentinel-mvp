'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, Loader2, RefreshCw, AlertCircle } from 'lucide-react'

export default function TestOAuthPage() {
  const [results, setResults] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [currentSession, setCurrentSession] = useState<any>(null)

  const addResult = (message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
    const timestamp = new Date().toLocaleTimeString()
    const prefix = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️'
    setResults(prev => [...prev, `${timestamp} ${prefix} ${message}`])
    console.log(`[OAuth Test] ${message}`)
  }

  const clearResults = () => {
    setResults([])
  }

  // Test 1: Environment Variables
  const testEnvironmentVariables = () => {
    addResult('=== Testing Environment Variables ===')
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    const appUrl = process.env.NEXT_PUBLIC_APP_URL

    addResult(`Supabase URL: ${supabaseUrl || 'MISSING'}`, supabaseUrl ? 'success' : 'error')
    addResult(`Supabase Key: ${supabaseKey ? `${supabaseKey.substring(0, 20)}...` : 'MISSING'}`, supabaseKey ? 'success' : 'error')
    addResult(`Google Client ID: ${googleClientId ? `${googleClientId.substring(0, 20)}...` : 'MISSING'}`, googleClientId ? 'success' : 'error')
    addResult(`App URL: ${appUrl || 'MISSING'}`, appUrl ? 'success' : 'error')
    
    if (googleClientId) {
      addResult(`Google Client ID length: ${googleClientId.length}`, googleClientId.length > 70 ? 'success' : 'warning')
      addResult(`Google Client ID format: ${googleClientId.endsWith('.apps.googleusercontent.com') ? 'Valid' : 'Invalid'}`, 
        googleClientId.endsWith('.apps.googleusercontent.com') ? 'success' : 'error')
    }
  }

  // Test 2: Supabase Connection
  const testSupabaseConnection = async () => {
    addResult('=== Testing Supabase Connection ===')
    setLoading(true)
    
    try {
      const { data, error } = await supabase.auth.getSession()
      
      if (error) {
        addResult(`Supabase connection error: ${error.message}`, 'error')
        addResult(`Error code: ${error.code}`, 'error')
      } else {
        addResult('Supabase connection successful', 'success')
        if (data.session) {
          addResult(`Current session found: ${data.session.user.email}`, 'success')
          setCurrentSession(data.session)
        } else {
          addResult('No active session', 'info')
        }
      }
    } catch (error) {
      addResult(`Supabase connection failed: ${error}`, 'error')
    }
    
    setLoading(false)
  }

  // Test 3: Google OAuth URL Generation
  const testOAuthUrlGeneration = () => {
    addResult('=== Testing OAuth URL Generation ===')
    
    try {
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
      if (!clientId) {
        addResult('Google Client ID not found', 'error')
        return
      }

      const redirectUri = `${window.location.origin}/auth/callback`
      addResult(`Redirect URI: ${redirectUri}`, 'info')
      
      const oauthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
      oauthUrl.searchParams.set('client_id', clientId)
      oauthUrl.searchParams.set('redirect_uri', redirectUri)
      oauthUrl.searchParams.set('response_type', 'code')
      oauthUrl.searchParams.set('scope', 'openid email profile')
      oauthUrl.searchParams.set('access_type', 'offline')
      oauthUrl.searchParams.set('prompt', 'consent')
      
      addResult('OAuth URL generated successfully', 'success')
      addResult(`URL: ${oauthUrl.toString().substring(0, 100)}...`, 'info')
      
    } catch (error) {
      addResult(`OAuth URL generation failed: ${error}`, 'error')
    }
  }

  // Test 4: Manual OAuth Test
  const testManualOAuth = async () => {
    addResult('=== Starting Manual OAuth Test ===')
    
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
        addResult(`OAuth initiation failed: ${error.message}`, 'error')
      } else {
        addResult('OAuth flow initiated successfully', 'success')
        addResult('You should be redirected to Google...', 'info')
      }
    } catch (error) {
      addResult(`OAuth test failed: ${error}`, 'error')
    }
  }

  // Test 5: Check URL Parameters
  const checkUrlParameters = () => {
    addResult('=== Checking URL Parameters ===')
    
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get('code')
    const error = urlParams.get('error')
    const errorDescription = urlParams.get('error_description')
    
    if (code) {
      addResult(`OAuth code found: ${code.substring(0, 20)}...`, 'success')
    } else {
      addResult('No OAuth code in URL', 'info')
    }
    
    if (error) {
      addResult(`OAuth error in URL: ${error}`, 'error')
      if (errorDescription) {
        addResult(`Error description: ${decodeURIComponent(errorDescription)}`, 'error')
      }
    } else {
      addResult('No OAuth error in URL', 'success')
    }
  }

  // Test 6: Test Session Exchange
  const testSessionExchange = async () => {
    addResult('=== Testing Session Exchange ===')
    setLoading(true)
    
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get('code')
    
    if (!code) {
      addResult('No OAuth code found in URL for exchange test', 'error')
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        addResult(`Session exchange failed: ${error.message}`, 'error')
        addResult(`Error code: ${error.code}`, 'error')
        addResult(`Error details: ${JSON.stringify(error)}`, 'error')
      } else {
        addResult('Session exchange successful!', 'success')
        addResult(`User: ${data.session?.user?.email}`, 'success')
        setCurrentSession(data.session)
      }
    } catch (error) {
      addResult(`Session exchange exception: ${error}`, 'error')
    }
    
    setLoading(false)
  }

  // Test 7: Server-side Auth Check
  const testServerAuth = async () => {
    addResult('=== Testing Server-side Auth ===')
    setLoading(true)
    
    try {
      const response = await fetch('/api/test-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ test: 'auth-check' }),
      })

      const result = await response.json()
      
      if (response.ok) {
        addResult('Server-side auth test successful', 'success')
        addResult(`Has session: ${result.hasSession}`, result.hasSession ? 'success' : 'warning')
        addResult(`Has user: ${result.hasUser}`, result.hasUser ? 'success' : 'warning')
        addResult(`Cookie length: ${result.cookieLength}`, 'info')
      } else {
        addResult(`Server-side auth test failed: ${result.error}`, 'error')
      }
    } catch (error) {
      addResult(`Server-side auth test exception: ${error}`, 'error')
    }
    
    setLoading(false)
  }

  // Run all tests
  const runAllTests = () => {
    clearResults()
    testEnvironmentVariables()
    setTimeout(() => testSupabaseConnection(), 500)
    setTimeout(() => testOAuthUrlGeneration(), 1000)
    setTimeout(() => checkUrlParameters(), 1500)
    setTimeout(() => testServerAuth(), 2000)
  }

  useEffect(() => {
    checkUrlParameters()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Test Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                OAuth Debug Tests
              </CardTitle>
              <CardDescription>
                Run these tests to diagnose OAuth authentication issues
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button onClick={runAllTests} className="w-full" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                Run All Tests
              </Button>
              
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" onClick={testEnvironmentVariables}>
                  Test Env Vars
                </Button>
                <Button variant="outline" size="sm" onClick={testSupabaseConnection}>
                  Test Supabase
                </Button>
                <Button variant="outline" size="sm" onClick={testOAuthUrlGeneration}>
                  Test OAuth URL
                </Button>
                <Button variant="outline" size="sm" onClick={testServerAuth}>
                  Test Server Auth
                </Button>
                <Button variant="outline" size="sm" onClick={testSessionExchange}>
                  Test Exchange
                </Button>
                <Button variant="outline" size="sm" onClick={testManualOAuth}>
                  Start OAuth
                </Button>
              </div>
              
              <Button variant="destructive" size="sm" onClick={clearResults} className="w-full">
                Clear Results
              </Button>
            </CardContent>
          </Card>

          {/* Current Session Info */}
          <Card>
            <CardHeader>
              <CardTitle>Current Session</CardTitle>
            </CardHeader>
            <CardContent>
              {currentSession ? (
                <div className="space-y-2">
                  <p className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="font-medium">Authenticated</span>
                  </p>
                  <p><strong>Email:</strong> {currentSession.user?.email}</p>
                  <p><strong>User ID:</strong> {currentSession.user?.id}</p>
                  <p><strong>Expires:</strong> {new Date(currentSession.expires_at * 1000).toLocaleString()}</p>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-600" />
                  <span>No active session</span>
                </div>
              )}
            </CardContent>
          </Card>

        </div>

        {/* Test Results */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
            <CardDescription>
              {results.length} test results
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
              {results.length === 0 ? (
                <p>No test results yet. Click "Run All Tests" to start.</p>
              ) : (
                results.map((result, index) => (
                  <div key={index} className="mb-1">
                    {result}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Quick Links</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <a href="/auth" className="text-blue-600 hover:underline">Main Auth Page</a>
              <a href="/dashboard" className="text-blue-600 hover:underline">Dashboard</a>
              <a href="/test-session" className="text-blue-600 hover:underline">Test Session</a>
              <a href="/test-env" className="text-blue-600 hover:underline">Test Environment</a>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  )
} 