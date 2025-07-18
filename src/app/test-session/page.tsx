'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, Loader2, RefreshCw } from 'lucide-react'
import Link from 'next/link'

export default function TestSessionPage() {
  const [sessionStatus, setSessionStatus] = useState<'loading' | 'authenticated' | 'not-authenticated'>('loading')
  const [user, setUser] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [lastCheck, setLastCheck] = useState<Date | null>(null)

  const checkSession = async () => {
    try {
      setSessionStatus('loading')
      setLastCheck(new Date())
      
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        setError(error.message)
        setSessionStatus('not-authenticated')
        return
      }

      if (session) {
        setUser(session.user)
        setSessionStatus('authenticated')
        setError(null)
      } else {
        setSessionStatus('not-authenticated')
        setUser(null)
      }
    } catch (error) {
      setError('Failed to check session')
      setSessionStatus('not-authenticated')
    }
  }

  useEffect(() => {
    checkSession()
  }, [])

  const handleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      
      if (error) {
        setError(error.message)
      }
    } catch (error) {
      setError('Failed to initiate sign in')
    }
  }

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      setSessionStatus('not-authenticated')
      setUser(null)
    } catch (error) {
      setError('Failed to sign out')
    }
  }

  const testGmailConnection = async () => {
    try {
      setError(null)
      console.log('Testing Gmail API access...')
      
      // Get the current session to ensure we're authenticated
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setError('No active session found')
        return
      }
      
      // This will test if the session is valid for Gmail connection
      const response = await fetch('/api/gmail/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Include the session token in the authorization header
          'Authorization': `Bearer ${session.access_token}`,
        },
        credentials: 'include', // Include cookies
        body: JSON.stringify({ 
          code: 'test-code', 
          state: 'test-state' 
        }),
      })

      const result = await response.json()
      console.log('Gmail API test response:', { status: response.status, result })
      
      if (response.status === 401) {
        setError('Session not valid for Gmail API calls - User must be authenticated first')
      } else if (response.status === 400) {
        setError(`Gmail API test response: ${result.error || 'Invalid request'}`)
      } else {
        setError(`Gmail API test response: ${response.status} - ${result.error || 'Unknown'}`)
      }
    } catch (error) {
      console.error('Gmail API test failed:', error)
      setError(`Gmail API test failed: ${error}`)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {sessionStatus === 'loading' && <Loader2 className="w-5 h-5 animate-spin" />}
            {sessionStatus === 'authenticated' && <CheckCircle className="w-5 h-5 text-green-600" />}
            {sessionStatus === 'not-authenticated' && <XCircle className="w-5 h-5 text-red-600" />}
            Session Test
          </CardTitle>
          <CardDescription>
            Test session persistence and Gmail API access
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {sessionStatus === 'loading' && (
            <p>Checking session status...</p>
          )}

          {sessionStatus === 'authenticated' && user && (
            <div className="space-y-3">
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm font-medium text-green-800">✅ Session Active!</p>
                <p className="text-xs text-green-600 mt-1">User ID: {user.id}</p>
                <p className="text-xs text-green-600">Email: {user.email}</p>
                {lastCheck && (
                  <p className="text-xs text-green-600">Last check: {lastCheck.toLocaleTimeString()}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Button onClick={testGmailConnection} variant="outline" className="w-full">
                  Test Gmail API Access
                </Button>
                <Link href="/dashboard">
                  <Button className="w-full">Go to Dashboard</Button>
                </Link>
                <Button onClick={handleSignOut} variant="outline" className="w-full">
                  Sign Out
                </Button>
              </div>
            </div>
          )}

          {sessionStatus === 'not-authenticated' && (
            <div className="space-y-3">
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm font-medium text-red-800">❌ No Active Session</p>
                <p className="text-xs text-red-600 mt-1">
                  You need to sign in before connecting Gmail
                </p>
                {lastCheck && (
                  <p className="text-xs text-red-600">Last check: {lastCheck.toLocaleTimeString()}</p>
                )}
              </div>
              
              {error && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm font-medium text-yellow-800">Error:</p>
                  <p className="text-xs text-yellow-600 mt-1">{error}</p>
                </div>
              )}
              
              <div className="space-y-2">
                <Button onClick={handleSignIn} className="w-full">
                  Sign In with Google
                </Button>
                <Button onClick={checkSession} variant="outline" className="w-full">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Session Check
                </Button>
                <Link href="/auth">
                  <Button variant="outline" className="w-full">
                    Go to Auth Page
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 