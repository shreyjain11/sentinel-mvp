'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, CheckCircle, XCircle, Mail } from 'lucide-react'

function GmailCallbackContent() {
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing')
  const [message, setMessage] = useState('Processing Gmail authorization...')
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code')
        const error = searchParams.get('error')

        if (error) {
          setStatus('error')
          setMessage(`Authorization failed: ${error}`)
          setTimeout(() => router.push('/dashboard'), 3000)
          return
        }

        if (!code) {
          setStatus('error')
          setMessage('No authorization code received')
          setTimeout(() => router.push('/dashboard'), 3000)
          return
        }

        setMessage('Exchanging authorization code for tokens...')

        // Exchange the code for tokens
        const response = await fetch('/api/gmail/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code }),
        })

        const result = await response.json()

        if (response.ok) {
          setStatus('success')
          setMessage('Gmail connected successfully! You can now parse your emails for subscriptions.')
          
          // Redirect to dashboard with success parameter
          setTimeout(() => router.push('/dashboard?gmail=connected'), 2000)
        } else {
          const errorMessage = result.error || 'Token exchange failed'
          const errorDetails = result.details ? ` (${result.details})` : ''
          const errorCode = result.code ? ` [Code: ${result.code}]` : ''
          throw new Error(`${errorMessage}${errorDetails}${errorCode}`)
        }
      } catch (error) {
        console.error('Gmail callback error:', error)
        setStatus('error')
        setMessage(`Failed to connect Gmail: ${error instanceof Error ? error.message : 'Unknown error'}`)
        setTimeout(() => router.push('/dashboard'), 3000)
      }
    }

    handleCallback()
  }, [searchParams, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            {status === 'processing' && <Loader2 className="w-5 h-5 animate-spin" />}
            {status === 'success' && <CheckCircle className="w-5 h-5 text-green-600" />}
            {status === 'error' && <XCircle className="w-5 h-5 text-red-600" />}
            <Mail className="w-5 h-5" />
            Gmail Authorization
          </CardTitle>
          <CardDescription>
            {status === 'processing' && 'Connecting your Gmail...'}
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
              <div className="bg-red-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
            </div>
          )}
          {status === 'error' && (
            <div className="space-y-2">
              <p className="text-xs text-gray-500 mt-4">
                You will be redirected to the dashboard in a few seconds...
              </p>
              <button 
                onClick={() => router.push('/dashboard')}
                className="text-xs text-blue-600 hover:underline"
              >
                Return to dashboard now
              </button>
            </div>
          )}
          {status === 'success' && (
            <div className="space-y-2">
              <p className="text-xs text-green-600 mt-4">
                Redirecting to dashboard...
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function GmailCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <Mail className="w-5 h-5" />
              Gmail Authorization
            </CardTitle>
            <CardDescription>
              Loading...
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              Initializing Gmail connection...
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-red-600 h-2 rounded-full animate-pulse" style={{ width: '30%' }}></div>
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <GmailCallbackContent />
    </Suspense>
  )
} 