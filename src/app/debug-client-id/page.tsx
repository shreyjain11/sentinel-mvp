'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function DebugClientIdPage() {
  const [authUrl, setAuthUrl] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const generateAuthUrl = async () => {
    setLoading(true)
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
        console.error('OAuth URL generation error:', error)
      } else if (data?.url) {
        setAuthUrl(data.url)
        console.log('Generated OAuth URL:', data.url)
      }
    } catch (error) {
      console.error('Error generating OAuth URL:', error)
    }
    setLoading(false)
  }

  const extractClientId = (url: string) => {
    try {
      const urlObj = new URL(url)
      return urlObj.searchParams.get('client_id')
    } catch {
      return null
    }
  }

  const clientId = authUrl ? extractClientId(authUrl) : null
  const expectedClientId = '354987449931-n8i3a9d2keavrmsL8rb3a3g5tp0faf0.apps.googleusercontent.com'

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Debug Client ID</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            
            <Button onClick={generateAuthUrl} disabled={loading} className="w-full">
              {loading ? 'Generating...' : 'Generate OAuth URL (Check Client ID)'}
            </Button>

            {authUrl && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Generated OAuth URL:</h3>
                  <div className="bg-gray-100 p-3 rounded text-xs font-mono break-all">
                    {authUrl}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="p-4 border rounded">
                    <h4 className="font-semibold mb-2">Client ID from Supabase:</h4>
                    <div className="font-mono text-sm break-all bg-yellow-50 p-2 rounded">
                      {clientId || 'Not found'}
                    </div>
                  </div>

                  <div className="p-4 border rounded">
                    <h4 className="font-semibold mb-2">Expected Client ID (Google Cloud Console):</h4>
                    <div className="font-mono text-sm break-all bg-green-50 p-2 rounded">
                      {expectedClientId}
                    </div>
                  </div>

                  <div className={`p-4 border rounded ${clientId === expectedClientId ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
                    <h4 className="font-semibold mb-2">Match Status:</h4>
                    <div className="text-sm">
                      {clientId === expectedClientId ? 
                        '✅ Client IDs match!' : 
                        '❌ Client IDs do NOT match - Update Supabase Dashboard!'
                      }
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 rounded">
                  <h4 className="font-semibold mb-2">Environment Variables Check:</h4>
                  <div className="text-sm space-y-1">
                    <div>App URL: {process.env.NEXT_PUBLIC_APP_URL}</div>
                    <div>Client ID from env: {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.substring(0, 30)}...</div>
                  </div>
                </div>
              </div>
            )}

          </CardContent>
        </Card>
      </div>
    </div>
  )
} 