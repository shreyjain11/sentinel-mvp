'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  ExternalLink,
  Copy,
  RefreshCw
} from 'lucide-react'

interface OAuthConfig {
  hasClientId: boolean
  clientIdLength: number
  clientIdPrefix: string
  clientIdSuffix: boolean
  hasClientSecret: boolean
  clientSecretLength: number
  clientSecretPrefix: string
  appUrl: string
  environment: string
}

export default function DebugOAuthSetupPage() {
  const [config, setConfig] = useState<OAuthConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [testResult, setTestResult] = useState<string | null>(null)

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/debug/oauth-config')
      const data = await response.json()
      setConfig(data)
    } catch (error) {
      console.error('Error fetching config:', error)
    } finally {
      setLoading(false)
    }
  }

  const testOAuthFlow = async () => {
    setTestResult('Testing...')
    try {
      // Try to refresh a token to test the OAuth setup
      const response = await fetch('/api/gmail/refresh-token', {
        method: 'POST',
        credentials: 'include',
      })
      
      if (response.ok) {
        setTestResult('✅ OAuth configuration is working!')
      } else {
        const error = await response.json()
        setTestResult(`❌ OAuth test failed: ${error.error}`)
      }
    } catch (error) {
      setTestResult(`❌ OAuth test failed: ${error}`)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  useEffect(() => {
    fetchConfig()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Failed to load configuration</p>
      </div>
    )
  }

  const getStatusIcon = (condition: boolean) => {
    return condition ? (
      <CheckCircle className="w-5 h-5 text-green-600" />
    ) : (
      <XCircle className="w-5 h-5 text-red-600" />
    )
  }

  const getStatusColor = (condition: boolean) => {
    return condition ? 'text-green-600' : 'text-red-600'
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">OAuth Setup Debug</h1>
          <p className="text-gray-600 mt-2">
            Diagnose and fix Google OAuth configuration issues
          </p>
        </div>

        {/* Configuration Status */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Current OAuth Configuration</CardTitle>
            <CardDescription>
              Checking your Google OAuth credentials and setup
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium mb-3">Google Client ID</h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(config.hasClientId)}
                      <span className={getStatusColor(config.hasClientId)}>
                        {config.hasClientId ? 'Present' : 'Missing'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(config.clientIdLength === 71)}
                      <span className={getStatusColor(config.clientIdLength === 71)}>
                        Length: {config.clientIdLength} (expected: 71)
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(config.clientIdSuffix)}
                      <span className={getStatusColor(config.clientIdSuffix)}>
                        {config.clientIdSuffix ? 'Valid format (.apps.googleusercontent.com)' : 'Invalid format'}
                      </span>
                    </div>
                    {config.hasClientId && (
                      <div className="text-sm text-gray-600">
                        Prefix: {config.clientIdPrefix}...
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-3">Google Client Secret</h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(config.hasClientSecret)}
                      <span className={getStatusColor(config.hasClientSecret)}>
                        {config.hasClientSecret ? 'Present' : 'Missing'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(config.clientSecretLength > 30)}
                      <span className={getStatusColor(config.clientSecretLength > 30)}>
                        Length: {config.clientSecretLength} (expected: &gt;30)
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(config.clientSecretPrefix.startsWith('G0CSPX-'))}
                      <span className={getStatusColor(config.clientSecretPrefix.startsWith('G0CSPX-'))}>
                        {config.clientSecretPrefix.startsWith('G0CSPX-') ? 'Valid format (G0CSPX-)' : 'Invalid format'}
                      </span>
                    </div>
                    {config.hasClientSecret && (
                      <div className="text-sm text-gray-600">
                        Prefix: {config.clientSecretPrefix}...
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h3 className="font-medium mb-3">App Configuration</h3>
                <div className="space-y-2">
                  <div>
                    <strong>App URL:</strong> {config.appUrl}
                  </div>
                  <div>
                    <strong>Environment:</strong> {config.environment}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test OAuth */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Test OAuth Configuration</CardTitle>
            <CardDescription>
              Test if your OAuth setup is working correctly
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button onClick={testOAuthFlow}>
                Test OAuth Setup
              </Button>
              {testResult && (
                <div className="p-3 bg-gray-50 rounded border">
                  <code className="text-sm">{testResult}</code>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Setup Instructions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Google Cloud Console Setup</CardTitle>
            <CardDescription>
              Step-by-step instructions to fix OAuth configuration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  <h3 className="font-medium text-yellow-800">Common Issue: "invalid_client" Error</h3>
                </div>
                <p className="text-yellow-700 text-sm">
                  This usually means your OAuth client doesn't exist in Google Cloud Console or the credentials don't match.
                </p>
              </div>

              <div>
                <h3 className="font-medium mb-3">Step 1: Go to Google Cloud Console</h3>
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.open('https://console.cloud.google.com', '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open Google Cloud Console
                  </Button>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-3">Step 2: Navigate to Credentials</h3>
                <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
                  <li>Select your project (or create a new one)</li>
                  <li>Go to "APIs & Services" → "Credentials"</li>
                  <li>Look for your OAuth 2.0 Client ID</li>
                </ol>
              </div>

              <div>
                <h3 className="font-medium mb-3">Step 3: Verify or Create OAuth Client</h3>
                <div className="space-y-3">
                  <p className="text-sm text-gray-700">
                    If you don't see an OAuth client, or if it doesn't match your configuration:
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
                    <li>Click "Create Credentials" → "OAuth client ID"</li>
                    <li>Choose "Web application"</li>
                    <li>Name it "Sentinel Gmail Integration"</li>
                    <li>Add these Authorized redirect URIs:</li>
                  </ol>
                  
                  <div className="space-y-2 ml-6">
                    <div className="flex items-center space-x-2 p-2 bg-gray-100 rounded">
                      <code className="text-sm flex-1">http://localhost:3000/auth/gmail/callback</code>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => copyToClipboard('http://localhost:3000/auth/gmail/callback')}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex items-center space-x-2 p-2 bg-gray-100 rounded">
                      <code className="text-sm flex-1">http://localhost:3000/auth/callback</code>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => copyToClipboard('http://localhost:3000/auth/callback')}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-3">Step 4: Update Environment Variables</h3>
                <p className="text-sm text-gray-700 mb-2">
                  Copy the Client ID and Client Secret from Google Cloud Console and update your <code>.env.local</code> file:
                </p>
                <div className="space-y-2">
                  <div className="p-3 bg-gray-100 rounded font-mono text-sm">
                    NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id_here<br/>
                    GOOGLE_CLIENT_SECRET=your_client_secret_here
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-3">Step 5: Enable Required APIs</h3>
                <p className="text-sm text-gray-700 mb-2">
                  Make sure these APIs are enabled in your Google Cloud project:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                  <li>Gmail API</li>
                  <li>Google+ API (for user info)</li>
                </ul>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-medium text-blue-800 mb-2">After Making Changes</h3>
                <ol className="list-decimal list-inside space-y-1 text-sm text-blue-700">
                  <li>Restart your development server</li>
                  <li>Clear your browser cache/cookies</li>
                  <li>Test the OAuth flow again</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 