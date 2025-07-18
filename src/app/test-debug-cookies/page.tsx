'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function TestDebugCookiesPage() {
  const [session, setSession] = useState<any>(null)
  const [cookies, setCookies] = useState<string>('')

  useEffect(() => {
    // Get current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      console.log('Frontend session:', session)
    })

    // Get all cookies
    const allCookies = document.cookie
    setCookies(allCookies)
    console.log('All cookies:', allCookies)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm w-full max-w-4xl">
        <div className="flex flex-col space-y-1.5 p-6">
          <h3 className="text-2xl font-semibold leading-none tracking-tight">
            Cookie Debug
          </h3>
          <p className="text-sm text-muted-foreground">
            Debug what cookies are being set by Supabase
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
                <p><strong>Access Token (first 50 chars):</strong> {session.access_token?.substring(0, 50)}...</p>
                <p><strong>Refresh Token (first 50 chars):</strong> {session.refresh_token?.substring(0, 50)}...</p>
              </div>
            ) : (
              <p className="text-sm text-red-600">❌ No session found</p>
            )}
          </div>

          {/* All Cookies */}
          <div className="border rounded p-4">
            <h4 className="font-semibold mb-2">All Browser Cookies:</h4>
            <div className="text-sm bg-gray-100 p-2 rounded overflow-auto max-h-40">
              {cookies ? (
                <pre>{cookies}</pre>
              ) : (
                <p>No cookies found</p>
              )}
            </div>
          </div>

          {/* Supabase-specific cookies */}
          <div className="border rounded p-4">
            <h4 className="font-semibold mb-2">Supabase Cookies:</h4>
            <div className="text-sm">
              {cookies.split(';').filter(cookie => 
                cookie.trim().startsWith('supabase') || 
                cookie.trim().startsWith('sb-') ||
                cookie.trim().includes('access') ||
                cookie.trim().includes('refresh')
              ).map((cookie, index) => (
                <div key={index} className="mb-1">
                  <strong>{cookie.split('=')[0].trim()}:</strong> {cookie.split('=')[1]?.substring(0, 50)}...
                </div>
              ))}
              {!cookies.split(';').some(cookie => 
                cookie.trim().startsWith('supabase') || 
                cookie.trim().startsWith('sb-')
              ) && (
                <p className="text-red-600">❌ No Supabase cookies found!</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 