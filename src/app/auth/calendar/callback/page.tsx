'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, CheckCircle, XCircle, Calendar } from 'lucide-react'

function CalendarCallbackContent() {
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing')
  const [message, setMessage] = useState('Processing calendar authorization...')
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
          setTimeout(() => router.push('/calendar'), 3000)
          return
        }

        if (!code) {
          setStatus('error')
          setMessage('No authorization code received')
          setTimeout(() => router.push('/calendar'), 3000)
          return
        }

        setMessage('Exchanging authorization code for tokens...')

        // Exchange the code for tokens (reuse existing Gmail token exchange)
        const response = await fetch('/api/gmail/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            code,
            scope: 'calendar' // Indicate this is for calendar
          }),
        })

        const result = await response.json()

        if (response.ok) {
          setStatus('success')
          setMessage('Calendar connected successfully! You can now sync your subscriptions.')
          
          // Redirect to calendar page with success parameter
          setTimeout(() => router.push('/calendar?connected=true'), 2000)
        } else {
          const errorMessage = result.error || 'Token exchange failed'
          const errorDetails = result.details ? ` (${result.details})` : ''
          const errorCode = result.code ? ` [Code: ${result.code}]` : ''
          throw new Error(`${errorMessage}${errorDetails}${errorCode}`)
        }
      } catch (error) {
        console.error('Calendar callback error:', error)
        setStatus('error')
        setMessage(`Failed to connect calendar: ${error instanceof Error ? error.message : 'Unknown error'}`)
        setTimeout(() => router.push('/calendar'), 3000)
      }
    }

    handleCallback()
  }, [searchParams, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            {status === 'processing' && <Loader2 className="w-5 h-5 animate-spin" />}
            {status === 'success' && <CheckCircle className="w-5 h-5 text-green-600" />}
            {status === 'error' && <XCircle className="w-5 h-5 text-red-600" />}
            <Calendar className="w-5 h-5" />
            Calendar Authorization
          </CardTitle>
          <CardDescription>
            {status === 'processing' && 'Connecting your Google Calendar...'}
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
                You will be redirected to the calendar page in a few seconds...
              </p>
              <button 
                onClick={() => router.push('/calendar')}
                className="text-xs text-blue-600 hover:underline"
              >
                Return to calendar now
              </button>
            </div>
          )}
          {status === 'success' && (
            <div className="space-y-2">
              <p className="text-xs text-green-600 mt-4">
                Redirecting to calendar page...
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function CalendarCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <Calendar className="w-5 h-5" />
              Calendar Authorization
            </CardTitle>
            <CardDescription>
              Loading...
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              Initializing calendar connection...
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '30%' }}></div>
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <CalendarCallbackContent />
    </Suspense>
  )
} 