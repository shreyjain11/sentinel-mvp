'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function DebugSessionPage() {
  const [sessionInfo, setSessionInfo] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { supabase } = await import('@/lib/supabase')
        
        // Check session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        // Check user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        // Get auth state
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          console.log('Auth state change:', event, session)
        })

        setSessionInfo({
          session: session ? {
            user: {
              id: session.user.id,
              email: session.user.email,
              created_at: session.user.created_at
            },
            access_token: session.access_token ? 'Present' : 'Missing',
            refresh_token: session.refresh_token ? 'Present' : 'Missing',
            expires_at: session.expires_at
          } : null,
          user: user ? {
            id: user.id,
            email: user.email,
            created_at: user.created_at
          } : null,
          sessionError: sessionError?.message || null,
          userError: userError?.message || null,
          timestamp: new Date().toISOString()
        })
      } catch (error) {
        setSessionInfo({
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        })
      } finally {
        setIsLoading(false)
      }
    }

    checkSession()
  }, [])

  const testSignIn = async () => {
    try {
      const { signInWithGoogle } = await import('@/lib/auth')
      await signInWithGoogle()
    } catch (error) {
      console.error('Sign in error:', error)
      alert('Sign in error: ' + error)
    }
  }

  const testSignOut = async () => {
    try {
      const { supabase } = await import('@/lib/supabase')
      const { error } = await supabase.auth.signOut()
      if (error) {
        alert('Sign out error: ' + error.message)
      } else {
        alert('Signed out successfully')
        window.location.reload()
      }
    } catch (error) {
      console.error('Sign out error:', error)
      alert('Sign out error: ' + error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Checking session...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Session Debug</h1>
          <p className="text-gray-600">Debugging authentication session state</p>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Session Status</CardTitle>
              <CardDescription>Current authentication state</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Session:</span>
                <Badge variant={sessionInfo.session ? "default" : "destructive"}>
                  {sessionInfo.session ? "Active" : "None"}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">User:</span>
                <Badge variant={sessionInfo.user ? "default" : "destructive"}>
                  {sessionInfo.user ? "Found" : "None"}
                </Badge>
              </div>
              {sessionInfo.sessionError && (
                <div className="text-sm text-red-600">
                  Session Error: {sessionInfo.sessionError}
                </div>
              )}
              {sessionInfo.userError && (
                <div className="text-sm text-red-600">
                  User Error: {sessionInfo.userError}
                </div>
              )}
            </CardContent>
          </Card>

          {sessionInfo.session && (
            <Card>
              <CardHeader>
                <CardTitle>Session Details</CardTitle>
                <CardDescription>Current session information</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div><strong>User ID:</strong> {sessionInfo.session.user.id}</div>
                  <div><strong>Email:</strong> {sessionInfo.session.user.email}</div>
                  <div><strong>Created:</strong> {new Date(sessionInfo.session.user.created_at).toLocaleString()}</div>
                  <div><strong>Access Token:</strong> {sessionInfo.session.access_token}</div>
                  <div><strong>Refresh Token:</strong> {sessionInfo.session.refresh_token}</div>
                  <div><strong>Expires:</strong> {sessionInfo.session.expires_at ? new Date(sessionInfo.session.expires_at).toLocaleString() : 'N/A'}</div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Test Actions</CardTitle>
              <CardDescription>Test authentication flows</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={testSignIn} className="w-full">
                Test Google Sign In
              </Button>
              {sessionInfo.session && (
                <Button onClick={testSignOut} variant="outline" className="w-full">
                  Sign Out
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Raw Session Data</CardTitle>
              <CardDescription>Complete session information for debugging</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto max-h-64">
                {JSON.stringify(sessionInfo, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 