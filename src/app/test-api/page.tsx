'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function TestApiPage() {
  const [session, setSession] = useState<any>(null)
  const [apiResult, setApiResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Get current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      console.log('Frontend session:', session)
    })
  }, [])

  const testApiCall = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/test-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important for cookies
        body: JSON.stringify({ test: 'data' }),
      })

      const result = await response.json()
      setApiResult(result)
      console.log('API result:', result)
    } catch (error) {
      console.error('API call error:', error)
      setApiResult({ error: error instanceof Error ? error.message : 'Unknown error' })
    }
    setLoading(false)
  }

  const forceRelogin = async () => {
    // Sign out and clear all storage
    await supabase.auth.signOut()
    localStorage.clear()
    document.cookie.split(";").forEach(function(c) { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });
    // Redirect to login
    window.location.href = '/auth'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm w-full max-w-2xl">
        <div className="flex flex-col space-y-1.5 p-6">
          <h3 className="text-2xl font-semibold leading-none tracking-tight">
            API Session Test
          </h3>
          <p className="text-sm text-muted-foreground">
            Test session passing to API routes
          </p>
        </div>
        <div className="p-6 pt-0 space-y-4">
          {/* Frontend Session Status */}
          <div className="border rounded p-4">
            <h4 className="font-semibold mb-2">Frontend Session:</h4>
            {session ? (
              <div className="text-sm">
                <p><strong>User ID:</strong> {session.user.id}</p>
                <p><strong>Email:</strong> {session.user.email}</p>
                <p><strong>Authenticated:</strong> ✅ Yes</p>
              </div>
            ) : (
              <p className="text-sm text-red-600">❌ No session found</p>
            )}
          </div>

          {/* Test API Call */}
          <div className="border rounded p-4">
            <h4 className="font-semibold mb-2">API Route Test:</h4>
            <div className="space-x-2">
              <button 
                onClick={testApiCall}
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Testing...' : 'Test API Call'}
              </button>
              <button 
                onClick={forceRelogin}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Force Re-login
              </button>
            </div>
            
            {apiResult && (
              <div className="mt-4 text-sm">
                <p><strong>Has Session:</strong> {apiResult.hasSession ? '✅ Yes' : '❌ No'}</p>
                <p><strong>Has User:</strong> {apiResult.hasUser ? '✅ Yes' : '❌ No'}</p>
                <p><strong>Cookie Length:</strong> {apiResult.cookieLength}</p>
                {apiResult.sessionError && (
                  <p className="text-red-600"><strong>Session Error:</strong> {JSON.stringify(apiResult.sessionError)}</p>
                )}
                {apiResult.userError && (
                  <p className="text-red-600"><strong>User Error:</strong> {JSON.stringify(apiResult.userError)}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 