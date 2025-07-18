'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Mail, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { signInWithGoogle } from "@/lib/auth"
import { useState, useEffect } from "react"
import { getCurrentUser } from "@/lib/auth"

export default function AuthPage() {
  const [loading, setLoading] = useState(false)
  const [debugInfo, setDebugInfo] = useState<string[]>([])

  const addDebugInfo = (message: string) => {
    console.log(`[Auth Debug] ${message}`)
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  useEffect(() => {
    addDebugInfo('Auth page loaded')
    
    // Check if user is already authenticated
    const checkAuth = async () => {
      try {
        addDebugInfo('Checking if user is already authenticated...')
        const user = await getCurrentUser()
        if (user) {
          addDebugInfo(`User already authenticated: ${user.email}`)
          addDebugInfo('Redirecting to dashboard...')
          window.location.href = '/dashboard'
        } else {
          addDebugInfo('No authenticated user found')
        }
      } catch (error) {
        addDebugInfo(`Error checking auth: ${error}`)
      }
    }

    checkAuth()
  }, [])

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true)
      addDebugInfo('Starting Google sign-in process...')
      
      await signInWithGoogle()
      addDebugInfo('Google sign-in initiated successfully')
      
      // Note: The redirect will happen automatically via Google OAuth
    } catch (error) {
      addDebugInfo(`Google sign-in error: ${error}`)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back to Home */}
        <Link href="/" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-8">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>

        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center mr-3">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <span className="text-3xl font-bold text-gray-900">Sentinel</span>
          </div>
          <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
            Privacy-First Authentication
          </span>
        </div>

        {/* Auth Card */}
        <Card className="trust-card">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Welcome to Sentinel</CardTitle>
            <CardDescription>
              Sign in with your Google account to start managing your subscriptions securely.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={handleGoogleSignIn} 
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              <Mail className="w-5 h-5 mr-2" />
              {loading ? 'Signing in...' : 'Continue with Google'}
            </Button>
            
            <p className="text-xs text-gray-500 text-center">
              By continuing, you agree to our{' '}
              <Link href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>
              {' '}and{' '}
              <Link href="/terms" className="text-blue-600 hover:underline">Terms of Service</Link>.
            </p>
            
            <div className="border-t pt-4">
              <div className="flex items-center justify-center text-sm text-gray-600">
                <Shield className="w-4 h-4 mr-2" />
                Your data is encrypted and never shared with third parties
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Debug Info (only in development) */}
        {process.env.NODE_ENV === 'development' && debugInfo.length > 0 && (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-sm">Debug Info</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs font-mono bg-gray-100 p-2 rounded max-h-32 overflow-y-auto">
                {debugInfo.map((info, index) => (
                  <div key={index} className="mb-1">{info}</div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-600">
            Need help? <Link href="/support" className="text-blue-600 hover:underline">Contact Support</Link>
          </p>
        </div>
      </div>
    </div>
  )
} 