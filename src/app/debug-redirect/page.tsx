'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function DebugRedirectPage() {
  const [oauthUrl, setOauthUrl] = useState<string>('')
  const [origin, setOrigin] = useState<string>('')

  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  const generateOAuthUrl = () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    const redirectUri = `${origin}/auth/gmail/callback`
    
    const url = new URL('https://accounts.google.com/o/oauth2/v2/auth')
    url.searchParams.set('client_id', clientId!)
    url.searchParams.set('redirect_uri', redirectUri)
    url.searchParams.set('scope', 'https://www.googleapis.com/auth/gmail.readonly')
    url.searchParams.set('response_type', 'code')
    url.searchParams.set('access_type', 'offline')
    url.searchParams.set('prompt', 'consent')
    
    setOauthUrl(url.toString())
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>OAuth Redirect URI Debug</CardTitle>
            <CardDescription>
              Check exactly what redirect URI your app is using
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            <div className="grid grid-cols-1 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">Current Configuration</h3>
                <div className="space-y-2 text-sm">
                  <div><strong>Origin:</strong> {origin || 'Loading...'}</div>
                  <div><strong>Redirect URI:</strong> {origin ? `${origin}/auth/gmail/callback` : 'Loading...'}</div>
                  <div><strong>Client ID:</strong> {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.substring(0, 30)}...</div>
                  <div><strong>App URL from env:</strong> {process.env.NEXT_PUBLIC_APP_URL}</div>
                </div>
              </div>

              <Button onClick={generateOAuthUrl}>
                Generate OAuth URL
              </Button>

              {oauthUrl && (
                <div className="p-4 bg-green-50 rounded-lg">
                  <h3 className="font-medium text-green-900 mb-2">Generated OAuth URL</h3>
                  <p className="text-sm text-green-800 break-all mb-4">{oauthUrl}</p>
                  <Button 
                    onClick={() => window.open(oauthUrl, '_blank')}
                    variant="outline"
                    size="sm"
                  >
                    Test OAuth URL
                  </Button>
                </div>
              )}

              <div className="p-4 bg-yellow-50 rounded-lg">
                <h3 className="font-medium text-yellow-900 mb-2">Google Cloud Console Setup</h3>
                <div className="text-sm text-yellow-800 space-y-2">
                  <p><strong>Add these redirect URIs to Google Cloud Console:</strong></p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li><code>{origin}/auth/gmail/callback</code></li>
                    <li><code>{origin}/auth/callback</code></li>
                  </ul>
                  <p className="mt-4"><strong>Steps:</strong></p>
                  <ol className="list-decimal list-inside ml-4 space-y-1">
                    <li>Go to <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="underline">Google Cloud Console</a></li>
                    <li>Navigate to "APIs & Services" → "Credentials"</li>
                    <li>Find your OAuth 2.0 Client ID</li>
                    <li>Click "Edit" (pencil icon)</li>
                    <li>Add the redirect URIs above to "Authorized redirect URIs"</li>
                    <li>Click "Save"</li>
                  </ol>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 