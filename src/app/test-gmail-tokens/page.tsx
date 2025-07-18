'use client'

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, CheckCircle, Database, Loader2 } from "lucide-react"

export default function TestGmailTokensPage() {
  const [testResult, setTestResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const testGmailTokensTable = async () => {
    setLoading(true)
    setError(null)
    setTestResult(null)

    try {
      const response = await fetch('/api/test-gmail-tokens')
      const result = await response.json()

      if (response.ok) {
        setTestResult(result)
      } else {
        setError(result.error || 'Test failed')
        setTestResult(result)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Gmail Tokens Table Test</h1>
            <p className="text-gray-600">
              This page helps you test if the Gmail tokens table is properly set up and accessible.
            </p>
          </div>

          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="w-5 h-5 text-blue-600" />
                  <span>Database Connection Test</span>
                </CardTitle>
                <CardDescription>
                  Test if the gmail_tokens table exists and is accessible
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={testGmailTokensTable} 
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <Database className="w-4 h-4 mr-2" />
                      Test Gmail Tokens Table
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {testResult && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    {testResult.success ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                    )}
                    <span>Test Results</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Status:</label>
                        <Badge variant={testResult.success ? "default" : "destructive"} className="mt-1">
                          {testResult.success ? 'Success' : 'Failed'}
                        </Badge>
                      </div>
                      {testResult.userId && (
                        <div>
                          <label className="text-sm font-medium text-gray-600">User ID:</label>
                          <p className="text-sm bg-gray-100 p-2 rounded mt-1 font-mono">
                            {testResult.userId}
                          </p>
                        </div>
                      )}
                    </div>

                    {testResult.message && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Message:</label>
                        <p className="text-sm bg-gray-100 p-2 rounded mt-1">
                          {testResult.message}
                        </p>
                      </div>
                    )}

                    {testResult.error && (
                      <div>
                        <label className="text-sm font-medium text-red-600">Error:</label>
                        <p className="text-sm bg-red-50 p-2 rounded mt-1 text-red-700">
                          {testResult.error}
                        </p>
                      </div>
                    )}

                    {testResult.details && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Details:</label>
                        <p className="text-sm bg-gray-100 p-2 rounded mt-1 font-mono text-xs">
                          {testResult.details}
                        </p>
                      </div>
                    )}

                    {testResult.code && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Error Code:</label>
                        <p className="text-sm bg-gray-100 p-2 rounded mt-1 font-mono">
                          {testResult.code}
                        </p>
                      </div>
                    )}

                    {testResult.hint && (
                      <div>
                        <label className="text-sm font-medium text-blue-600">Hint:</label>
                        <p className="text-sm bg-blue-50 p-2 rounded mt-1 text-blue-700">
                          {testResult.hint}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {error && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <span>Error</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-red-700">{error}</p>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Troubleshooting Steps</CardTitle>
                <CardDescription>
                  If the test fails, follow these steps to fix the issue
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-medium text-yellow-900 mb-2">1. Run the Database Setup</h4>
                    <p className="text-sm text-yellow-800 mb-2">
                      Copy and paste the SQL from <code className="bg-yellow-100 px-1 rounded">setup-gmail-tokens.sql</code> 
                      into your Supabase SQL editor and run it.
                    </p>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">2. Check RLS Policies</h4>
                    <p className="text-sm text-blue-800 mb-2">
                      Make sure Row Level Security is enabled and the policies are correctly set up.
                    </p>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-medium text-green-900 mb-2">3. Verify Authentication</h4>
                    <p className="text-sm text-green-800 mb-2">
                      Ensure you're properly authenticated before testing the Gmail tokens functionality.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
} 