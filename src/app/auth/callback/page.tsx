'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing')
  const [message, setMessage] = useState('Processing authentication...')

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('Auth callback page loaded')
        
        // Check for OAuth errors in URL params
        const error = searchParams.get('error')
        const errorDescription = searchParams.get('error_description')
        
        if (error) {
          console.error('OAuth error in URL:', { error, errorDescription })
          setStatus('error')
          setMessage(`OAuth Error: ${error}${errorDescription ? ` - ${errorDescription}` : ''}`)
          return
        }

        // Handle the OAuth callback by exchanging the code for a session
        const { data, error: authError } = await supabase.auth.getSession()
        
        if (authError) {
          console.error('Auth callback error:', authError)
          setStatus('error')
          setMessage(`Authentication error: ${authError.message}`)
          return
        }

        if (!data.session) {
          console.error('No session found after OAuth callback')
          console.log('Attempting to exchange OAuth code...')
          
          // Try to exchange the OAuth code manually
          const { data: exchangeData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(
            searchParams.get('code') || ''
          )
          
          if (exchangeError) {
            console.error('Code exchange error:', exchangeError)
            setStatus('error')
            setMessage(`Code exchange failed: ${exchangeError.message}`)
            return
          }
          
          if (!exchangeData.session) {
            console.error('No session after code exchange')
            setStatus('error')
            setMessage('Failed to create session after code exchange')
            return
          }
          
          console.log('Session created via code exchange:', exchangeData.session.user.email)
        } else {
          console.log('Session found:', data.session.user.email)
        }

        setStatus('success')
        setMessage('Authentication successful! Redirecting to dashboard...')
        
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          router.push('/dashboard')
        }, 2000)
        
      } catch (error) {
        console.error('Auth callback exception:', error)
        setStatus('error')
        setMessage('An unexpected error occurred during authentication')
      }
    }

    handleAuthCallback()
  }, [router, searchParams])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            {status === 'processing' && <Loader2 className="w-5 h-5 animate-spin" />}
            {status === 'success' && <CheckCircle className="w-5 h-5 text-green-600" />}
            {status === 'error' && <XCircle className="w-5 h-5 text-red-600" />}
            Authentication
          </CardTitle>
          <CardDescription>
            {status === 'processing' && 'Completing your sign-in...'}
            {status === 'success' && 'Successfully authenticated!'}
            {status === 'error' && 'Authentication failed'}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-gray-600 mb-4">
            {message}
          </p>
          {status === 'processing' && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
            </div>
          )}
          {status === 'error' && (
            <div className="space-y-2">
              <p className="text-xs text-gray-500 mt-4">
                You will be redirected to the login page in a few seconds...
              </p>
              <button 
                onClick={() => router.push('/auth')}
                className="text-xs text-blue-600 hover:underline"
              >
                Return to login
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 