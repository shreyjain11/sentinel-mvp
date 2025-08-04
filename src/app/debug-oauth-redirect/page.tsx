'use client'

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, CheckCircle, Info, ExternalLink } from "lucide-react"
import Link from "next/link"

export default function DebugOAuthRedirectPage() {
  const [currentUrl, setCurrentUrl] = useState('')
  const [redirectUri, setRedirectUri] = useState('')
  const [isLocalhost, setIsLocalhost] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentUrl(window.location.href)
      setIsLocalhost(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      setRedirectUri(isLocalhost ? 'http://localhost:3000/auth/callback' : `${window.location.origin}/auth/callback`)
    }
  }, [isLocalhost])

  const testRedirectUri = () => {
    const testUri = isLocalhost ? 'http://localhost:3000/auth/callback' : `${window.location.origin}/auth/callback`
    alert(`Your app is using this redirect URI: ${testUri}\n\nMake sure this exact URI is added to your Google Cloud Console OAuth credentials.`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">OAuth Redirect URI Debug</h1>
            <p className="text-gray-600">
              This page helps you debug OAuth redirect URI mismatch errors.
            </p>
          </div>

          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Info className="w-5 h-5 text-blue-600" />
                  <span>Current Environment</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Current URL:</label>
                    <p className="text-sm bg-gray-100 p-2 rounded mt-1 font-mono break-all">{currentUrl}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Environment:</label>
                    <Badge variant={isLocalhost ? "default" : "secondary"} className="mt-1">
                      {isLocalhost ? 'Development (localhost)' : 'Production'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  <span>Redirect URI Configuration</span>
                </CardTitle>
                <CardDescription>
                  Your app is configured to use this redirect URI for OAuth
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">App Redirect URI:</label>
                  <p className="text-sm bg-blue-50 p-3 rounded mt-1 font-mono break-all border border-blue-200">
                    {redirectUri}
                  </p>
                </div>
                
                <Button onClick={testRedirectUri} className="w-full">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Copy Redirect URI to Clipboard
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Required Google Cloud Console Setup</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-medium text-green-900 mb-2">Add these URIs to Google Cloud Console:</h4>
                  <div className="space-y-2">
                    <div className="bg-card p-2 rounded border font-mono text-sm">
                      http://localhost:3000/auth/callback
                    </div>
                    <div className="bg-card p-2 rounded border font-mono text-sm">
                      https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
                    </div>
                  </div>
                </div>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-medium text-yellow-900 mb-2">Steps to Fix:</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-yellow-800">
                    <li>Go to <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google Cloud Console</a></li>
                    <li>Navigate to APIs & Services → Credentials</li>
                    <li>Find your OAuth 2.0 Client ID and click on it</li>
                    <li>In "Authorized redirect URIs", add the URIs above</li>
                    <li>Replace YOUR_PROJECT_REF with your actual Supabase project reference</li>
                    <li>Click Save</li>
                    <li>Wait 5-10 minutes for changes to propagate</li>
                  </ol>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Test OAuth Flow</CardTitle>
                <CardDescription>
                  Try the OAuth flow after updating your Google Cloud Console settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex space-x-4">
                  <Link href="/auth">
                    <Button>Test OAuth Sign In</Button>
                  </Link>
                  <Link href="/dashboard">
                    <Button variant="outline">Go to Dashboard</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
} 