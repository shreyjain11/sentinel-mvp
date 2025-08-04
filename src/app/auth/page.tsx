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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back to Home */}
        <Link href="/" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>

        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-premium-purple rounded-xl flex items-center justify-center mr-4">
                                <Shield className="w-8 h-8 text-card-foreground" />
            </div>
            <span className="text-4xl font-bold text-foreground">Sentinel</span>
          </div>
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 text-primary border border-primary/20">
            Privacy-First Authentication
          </div>
        </div>

        {/* Auth Card */}
        <Card className="premium-card-hero">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-foreground">Welcome to Sentinel</CardTitle>
            <CardDescription className="text-muted-foreground">
              Sign in with your Google account to start managing your subscriptions securely.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Button 
              onClick={handleGoogleSignIn} 
              disabled={loading}
              className="w-full premium-button"
              size="lg"
            >
              <Mail className="w-5 h-5 mr-2" />
              {loading ? 'Signing in...' : 'Continue with Google'}
            </Button>
            
            <p className="text-xs text-muted-foreground text-center">
              By continuing, you agree to our{' '}
              <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
              {' '}and{' '}
              <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link>.
            </p>
            
            <div className="border-t border-border pt-4">
              <div className="flex items-center justify-center text-sm text-muted-foreground">
                <Shield className="w-4 h-4 mr-2" />
                Your data is encrypted and never shared with third parties
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Debug Info (only in development) */}
        {process.env.NODE_ENV === 'development' && debugInfo.length > 0 && (
          <Card className="mt-6 premium-card">
            <CardHeader>
              <CardTitle className="text-sm text-foreground">Debug Info</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs font-mono bg-muted p-3 rounded-lg max-h-32 overflow-y-auto text-muted-foreground">
                {debugInfo.map((info, index) => (
                  <div key={index} className="mb-1">{info}</div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-muted-foreground">
            Need help? <Link href="/support" className="text-primary hover:underline">Contact Support</Link>
          </p>
        </div>
      </div>
    </div>
  )
} 