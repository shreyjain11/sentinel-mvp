'use client'

import { useState } from 'react'
import { GmailService } from '@/lib/gmail'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function TestGmailOAuthPage() {
  const [results, setResults] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [oauthUrl, setOauthUrl] = useState<string>('')

  const addResult = (message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
    const timestamp = new Date().toLocaleTimeString()
    setResults(prev => [...prev, `[${timestamp}] ${message}`])
  }

  const clearResults = () => setResults([])

  // Test 1: Environment Variables
  const testEnvironmentVariables = () => {
    addResult('=== Testing Environment Variables ===')
    
    const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    const appUrl = process.env.NEXT_PUBLIC_APP_URL

    addResult(`Google Client ID: ${googleClientId ? '✓ Found' : '✗ Missing'}`, googleClientId ? 'success' : 'error')
    addResult(`App URL: ${appUrl || '✗ Missing'}`, appUrl ? 'success' : 'error')
    
    if (googleClientId) {
      addResult(`Client ID length: ${googleClientId.length}`, googleClientId.length > 70 ? 'success' : 'warning')
      addResult(`Client ID format: ${googleClientId.endsWith('.apps.googleusercontent.com') ? '✓ Valid' : '✗ Invalid'}`, 
        googleClientId.endsWith('.apps.googleusercontent.com') ? 'success' : 'error')
    }
  }

  // Test 2: Session Check
  const testSession = async () => {
    addResult('=== Testing User Session ===')
    setLoading(true)
    
    try {
      const { data, error } = await supabase.auth.getSession()
      
      if (error) {
        addResult(`Session error: ${error.message}`, 'error')
      } else if (data.session) {
        addResult(`✓ Session found: ${data.session.user.email}`, 'success')
        addResult(`User ID: ${data.session.user.id}`, 'info')
      } else {
        addResult('✗ No active session - please log in first', 'error')
      }
    } catch (error) {
      addResult(`Session check failed: ${error}`, 'error')
    }
    
    setLoading(false)
  }

  // Test 3: OAuth URL Generation
  const testOAuthUrlGeneration = async () => {
    addResult('=== Testing OAuth URL Generation ===')
    setLoading(true)
    
    try {
      const url = await GmailService.initiateGmailOAuth()
      setOauthUrl(url)
      addResult('✓ OAuth URL generated successfully', 'success')
      addResult(`URL: ${url.substring(0, 100)}...`, 'info')
      
      // Extract and verify components
      const urlObj = new URL(url)
      const clientId = urlObj.searchParams.get('client_id')
      const redirectUri = urlObj.searchParams.get('redirect_uri')
      const scope = urlObj.searchParams.get('scope')
      
      addResult(`Client ID in URL: ${clientId ? '✓ Present' : '✗ Missing'}`, clientId ? 'success' : 'error')
      addResult(`Redirect URI: ${redirectUri}`, 'info')
      addResult(`Scope: ${scope}`, 'info')
      
    } catch (error) {
      addResult(`✗ OAuth URL generation failed: ${error}`, 'error')
    }
    
    setLoading(false)
  }

  // Test 4: Manual OAuth Test
  const testManualOAuth = () => {
    addResult('=== Starting Manual OAuth Test ===')
    
    if (!oauthUrl) {
      addResult('✗ No OAuth URL available. Run "Test OAuth URL Generation" first.', 'error')
      return
    }
    
    addResult('Opening OAuth URL in new tab...', 'info')
    window.open(oauthUrl, '_blank')
    addResult('✓ OAuth URL opened. Check the new tab for any errors.', 'success')
  }

  // Test 5: Check URL Parameters
  const checkUrlParameters = () => {
    addResult('=== Checking URL Parameters ===')
    
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get('code')
    const error = urlParams.get('error')
    const errorDescription = urlParams.get('error_description')
    
    if (code) {
      addResult(`✓ OAuth code found: ${code.substring(0, 20)}...`, 'success')
    } else {
      addResult('No OAuth code in URL', 'info')
    }
    
    if (error) {
      addResult(`✗ OAuth error: ${error}`, 'error')
      if (errorDescription) {
        addResult(`Error description: ${decodeURIComponent(errorDescription)}`, 'error')
      }
    } else {
      addResult('✓ No OAuth error in URL', 'success')
    }
  }

  // Test 6: Verify Redirect URI
  const verifyRedirectUri = () => {
    addResult('=== Verifying Redirect URI Configuration ===')
    
    const expectedRedirectUri = 'http://localhost:3000/auth/gmail/callback'
    const currentOrigin = window.location.origin
    const currentRedirectUri = `${currentOrigin}/auth/gmail/callback`
    
    addResult(`Expected redirect URI: ${expectedRedirectUri}`, 'info')
    addResult(`Current redirect URI: ${currentRedirectUri}`, 'info')
    
    if (expectedRedirectUri === currentRedirectUri) {
      addResult('✓ Redirect URIs match', 'success')
    } else {
      addResult('✗ Redirect URIs do not match!', 'error')
      addResult('Make sure to add BOTH redirect URIs to Google Cloud Console:', 'warning')
      addResult('1. http://localhost:3000/auth/gmail/callback', 'info')
      addResult('2. http://localhost:3000/auth/callback', 'info')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Gmail OAuth Debug Tool</CardTitle>
            <CardDescription>
              Test and debug Gmail OAuth configuration to fix the 401 invalid_client error
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Test Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Button onClick={testEnvironmentVariables} disabled={loading}>
                Test Environment Variables
              </Button>
              <Button onClick={testSession} disabled={loading}>
                Test User Session
              </Button>
              <Button onClick={testOAuthUrlGeneration} disabled={loading}>
                Test OAuth URL Generation
              </Button>
              <Button onClick={testManualOAuth} disabled={loading || !oauthUrl}>
                Test Manual OAuth
              </Button>
              <Button onClick={checkUrlParameters} disabled={loading}>
                Check URL Parameters
              </Button>
              <Button onClick={verifyRedirectUri} disabled={loading}>
                Verify Redirect URI
              </Button>
              <Button onClick={clearResults} variant="outline">
                Clear Results
              </Button>
            </div>

            {/* OAuth URL Display */}
            {oauthUrl && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">Generated OAuth URL</h3>
                <p className="text-sm text-blue-800 break-all">{oauthUrl}</p>
                <Button 
                  onClick={() => window.open(oauthUrl, '_blank')}
                  className="mt-2"
                  size="sm"
                >
                  Open OAuth URL
                </Button>
              </div>
            )}

            {/* Results */}
            <div className="space-y-4">
              <h3 className="font-medium">Test Results</h3>
              <div className="max-h-96 overflow-y-auto bg-gray-100 rounded-lg p-4">
                {results.length === 0 ? (
                  <p className="text-gray-500">Run tests to see results...</p>
                ) : (
                  <div className="space-y-1">
                    {results.map((result, index) => (
                      <div key={index} className="text-sm font-mono">
                        {result}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Troubleshooting Guide */}
            <div className="p-4 bg-yellow-50 rounded-lg">
              <h3 className="font-medium text-yellow-900 mb-2">Troubleshooting 401: invalid_client</h3>
              <div className="text-sm text-yellow-800 space-y-2">
                <p><strong>1. Check Google Cloud Console:</strong></p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Go to <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="underline">Google Cloud Console</a></li>
                  <li>Navigate to "APIs & Services" → "Credentials"</li>
                  <li>Find your OAuth 2.0 Client ID</li>
                  <li>Verify the Client ID matches your .env.local file</li>
                </ul>
                
                <p><strong>2. Check Authorized Redirect URIs:</strong></p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Add: <code>http://localhost:3000/auth/gmail/callback</code></li>
                  <li>Add: <code>http://localhost:3000/auth/callback</code></li>
                  <li>Make sure there are no extra spaces or characters</li>
                </ul>
                
                <p><strong>3. Check OAuth Consent Screen:</strong></p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Go to "APIs & Services" → "OAuth consent screen"</li>
                  <li>Make sure your app is published or in testing</li>
                  <li>Add your email as a test user if in testing mode</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 