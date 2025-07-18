'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function TestAuthPage() {
  const [authStatus, setAuthStatus] = useState<'loading' | 'authenticated' | 'not-authenticated'>('loading')
  const [user, setUser] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        setError(error.message)
        setAuthStatus('not-authenticated')
        return
      }

      if (session) {
        setUser(session.user)
        setAuthStatus('authenticated')
      } else {
        setAuthStatus('not-authenticated')
      }
    } catch (error) {
      setError('Failed to check authentication')
      setAuthStatus('not-authenticated')
    }
  }

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
      setAuthStatus('not-authenticated')
      setUser(null)
    } catch (error) {
      setError('Failed to sign out')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {authStatus === 'loading' && <Loader2 className="w-5 h-5 animate-spin" />}
            {authStatus === 'authenticated' && <CheckCircle className="w-5 h-5 text-green-600" />}
            {authStatus === 'not-authenticated' && <XCircle className="w-5 h-5 text-red-600" />}
            Authentication Test
          </CardTitle>
          <CardDescription>
            Check your authentication status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {authStatus === 'loading' && (
            <p>Checking authentication status...</p>
          )}

          {authStatus === 'authenticated' && user && (
            <div className="space-y-3">
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm font-medium text-green-800">✅ Authenticated!</p>
                <p className="text-xs text-green-600 mt-1">User ID: {user.id}</p>
                <p className="text-xs text-green-600">Email: {user.email}</p>
              </div>
              
              <div className="space-y-2">
                <Link href="/dashboard">
                  <Button className="w-full">Go to Dashboard</Button>
                </Link>
                <Button variant="outline" onClick={handleSignOut} className="w-full">
                  Sign Out
                </Button>
              </div>
            </div>
          )}

          {authStatus === 'not-authenticated' && (
            <div className="space-y-3">
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm font-medium text-red-800">❌ Not Authenticated</p>
                <p className="text-xs text-red-600 mt-1">
                  You need to sign in before connecting Gmail
                </p>
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