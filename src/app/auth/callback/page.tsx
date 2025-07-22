'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, CheckCircle, XCircle, Shield } from 'lucide-react'

function AuthCallbackContent() {
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing')
  const [message, setMessage] = useState('Processing authentication...')
  const [debugInfo, setDebugInfo] = useState<string[]>([])
  const router = useRouter()
  const searchParams = useSearchParams()

  const addDebugInfo = (info: string) => {
    console.log(`[Auth Debug] ${info}`)
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${info}`])
  }

  useEffect(() => {
    const handleCallback = async () => {
      try {
        addDebugInfo('Starting auth callback...')
        addDebugInfo(`Current URL: ${window.location.href}`)
        addDebugInfo(`Hash: ${window.location.hash}`)
        addDebugInfo(`Search params: ${window.location.search}`)

        // Check for error first
        const error = searchParams.get('error')
        if (error) {
          addDebugInfo(`OAuth error detected: ${error}`)
          setStatus('error')
          setMessage(`Authentication failed: ${error}`)
          setTimeout(() => router.push('/auth'), 3000)
          return
        }

        setMessage('Completing authentication...')
        addDebugInfo('No OAuth errors found, proceeding with session check...')

        // Import supabase
        const { supabase } = await import('@/lib/supabase')
        addDebugInfo('Supabase client imported successfully')
        
        // Check if we have a hash fragment with access_token (OAuth response)
        const hash = window.location.hash
        if (hash) {
          addDebugInfo(`Processing OAuth hash fragment: ${hash.substring(0, 50)}...`)
          
          // Let Supabase handle the OAuth response
          const { data: { session }, error: authError } = await supabase.auth.getSession()
          
          if (authError) {
            addDebugInfo(`Auth error: ${authError.message}`)
            console.error('Auth error:', authError)
            setStatus('error')
            setMessage(`Authentication error: ${authError.message}`)
            setTimeout(() => router.push('/auth'), 3000)
            return
          }

          if (session) {
            addDebugInfo(`Session found: ${session.user.email}`)
            console.log('Session found:', session.user.email)
            setStatus('success')
            setMessage('Authentication successful!')
            setTimeout(() => router.push('/dashboard'), 2000)
            return
          } else {
            addDebugInfo('No session found after processing hash')
          }
        } else {
          addDebugInfo('No hash fragment found in URL')
        }

        // Check for error parameters
        const errorParam = searchParams.get('error')
        const errorDescription = searchParams.get('error_description')
        
        if (errorParam) {
          addDebugInfo(`OAuth error param: ${errorParam}`)
          console.error('OAuth error:', errorParam, errorDescription)
          setStatus('error')
          setMessage(`Authentication failed: ${errorDescription || errorParam}`)
          setTimeout(() => router.push('/auth'), 3000)
          return
        }

        // Try to get existing session
        addDebugInfo('Attempting to get existing session...')
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          addDebugInfo(`Session error: ${sessionError.message}`)
          console.error('Session error:', sessionError)
          setStatus('error')
          setMessage(`Session error: ${sessionError.message}`)
          setTimeout(() => router.push('/auth'), 3000)
          return
        }

        if (session) {
          addDebugInfo(`Existing session found: ${session.user.email}`)
          console.log('Existing session found:', session.user.email)
          setStatus('success')
          setMessage('Authentication successful!')
          setTimeout(() => router.push('/dashboard'), 2000)
        } else {
          addDebugInfo('No session found - checking auth state...')
          
          // Try to get user info as a last resort
          const { data: { user }, error: userError } = await supabase.auth.getUser()
          
          if (user && !userError) {
            addDebugInfo(`User found via getUser: ${user.email}`)
            setStatus('success')
            setMessage('Authentication successful!')
            setTimeout(() => router.push('/dashboard'), 2000)
          } else {
            addDebugInfo(`No user found via getUser: ${userError?.message || 'No error'}`)
            console.error('No session or user found')
            setStatus('error')
            setMessage('No session found after authentication. Please try again.')
            setTimeout(() => router.push('/auth'), 3000)
          }
        }
      } catch (error) {
        addDebugInfo(`Exception caught: ${error}`)
        console.error('Auth callback error:', error)
        setStatus('error')
        setMessage(`Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
        setTimeout(() => router.push('/auth'), 3000)
      }
    }

    handleCallback()
  }, [searchParams, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            {status === 'processing' && <Loader2 className="w-5 h-5 animate-spin" />}
            {status === 'success' && <CheckCircle className="w-5 h-5 text-green-600" />}
            {status === 'error' && <XCircle className="w-5 h-5 text-red-600" />}
            <Shield className="w-5 h-5" />
            Authentication
          </CardTitle>
          <CardDescription>
            {status === 'processing' && 'Completing authentication...'}
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
                Return to login now
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
          
          {/* Debug Info - Show in development or when there's an error */}
          {(process.env.NODE_ENV === 'development' || status === 'error') && debugInfo.length > 0 && (
            <div className="mt-4 p-3 bg-gray-100 rounded text-left">
              <p className="text-xs font-semibold mb-2">Debug Info:</p>
              <div className="text-xs font-mono max-h-32 overflow-y-auto">
                {debugInfo.map((info, index) => (
                  <div key={index} className="mb-1 text-gray-700">{info}</div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <Shield className="w-5 h-5" />
              Authentication
            </CardTitle>
            <CardDescription>
              Loading...
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              Initializing authentication...
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '30%' }}></div>
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  )
} 