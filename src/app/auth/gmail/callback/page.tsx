'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { GmailService } from '@/lib/gmail'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'

export default function GmailCallbackPage() {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing')
  const [message, setMessage] = useState('Processing Gmail authorization...')

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code')
        const state = searchParams.get('state')
        const error = searchParams.get('error')

        if (error) {
          throw new Error(`OAuth error: ${error}`)
        }

        if (!code || !state) {
          throw new Error('Missing authorization code or state parameter')
        }

        // First check if we have a valid session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('Session error:', sessionError)
          throw new Error(`Session error: ${sessionError.message}`)
        }

        if (!session) {
          console.error('No session found during Gmail callback')
          throw new Error('No active session found. Please log in again.')
        }

        console.log('Session found:', {
          userId: session.user.id,
          email: session.user.email
        })

        setMessage('Exchanging authorization code for access tokens...')

        // Exchange code for tokens
        const success = await GmailService.handleOAuthCallback(code, state)

        if (success) {
          setStatus('success')
          setMessage('Gmail connected successfully! Redirecting to dashboard...')
          
          // Redirect to dashboard after a short delay
          setTimeout(() => {
            window.location.href = '/dashboard'
          }, 2000)
        } else {
          throw new Error('Failed to exchange authorization code')
        }
      } catch (error) {
        console.error('Gmail OAuth callback error:', error)
        setStatus('error')
        setMessage(error instanceof Error ? error.message : 'An unexpected error occurred')
        
        // Redirect to dashboard after error display
        setTimeout(() => {
          window.location.href = '/dashboard'
        }, 5000)
      }
    }

    handleCallback()
  }, [searchParams])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            {status === 'processing' && <Loader2 className="w-5 h-5 animate-spin" />}
            {status === 'success' && <CheckCircle className="w-5 h-5 text-green-600" />}
            {status === 'error' && <XCircle className="w-5 h-5 text-red-600" />}
            Gmail Authorization
          </CardTitle>
          <CardDescription>
            {status === 'processing' && 'Connecting your Gmail account...'}
            {status === 'success' && 'Successfully connected!'}
            {status === 'error' && 'Connection failed'}
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
                You will be redirected to the dashboard in a few seconds...
              </p>
              <button 
                onClick={() => window.location.href = '/dashboard'}
                className="text-xs text-blue-600 hover:underline"
              >
                Return to dashboard now
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 