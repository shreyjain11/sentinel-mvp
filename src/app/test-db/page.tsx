'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { getCurrentUser, getSession } from '@/lib/auth'

export default function TestDBPage() {
  const [results, setResults] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const addResult = (message: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const clearResults = () => {
    setResults([])
  }

  const testConnection = async () => {
    setLoading(true)
    addResult('Testing basic connection...')
    
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('count')
        .limit(1)
      
      if (error) {
        addResult(`❌ Connection failed: ${error.message}`)
        addResult(`Error code: ${error.code}`)
        addResult(`Error details: ${JSON.stringify(error.details)}`)
      } else {
        addResult('✅ Basic connection successful')
      }
    } catch (error) {
      addResult(`❌ Exception: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const testAuthentication = async () => {
    setLoading(true)
    addResult('Testing authentication...')
    
    try {
      const session = await getSession()
      if (!session) {
        addResult('❌ No session found')
        return
      }
      
      addResult(`✅ Session found for user: ${session.user.email}`)
      addResult(`User ID: ${session.user.id}`)
      addResult(`Access token: ${session.access_token ? 'Present' : 'Missing'}`)
      
      const user = await getCurrentUser()
      if (user) {
        addResult(`✅ Current user: ${user.name} (${user.email})`)
      } else {
        addResult('❌ Could not get current user')
      }
    } catch (error) {
      addResult(`❌ Authentication test failed: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const testRLS = async () => {
    setLoading(true)
    addResult('Testing Row Level Security...')
    
    try {
      const session = await getSession()
      if (!session) {
        addResult('❌ No session - cannot test RLS')
        return
      }
      
      // Test reading subscriptions
      const { data: readData, error: readError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', session.user.id)
        .limit(1)
      
      if (readError) {
        addResult(`❌ Read test failed: ${readError.message}`)
        addResult(`Read error code: ${readError.code}`)
      } else {
        addResult(`✅ Read test successful - found ${readData?.length || 0} subscriptions`)
      }
      
      // Test inserting a subscription
      const testSubscription = {
        user_id: session.user.id,
        name: 'Test Subscription',
        service: 'Test Service',
        type: 'subscription',
        status: 'active',
        amount: 9.99,
        currency: 'USD',
        billing_cycle: 'monthly',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
        auto_renew: true,
        category: 'Test'
      }
      
      const { data: insertData, error: insertError } = await supabase
        .from('subscriptions')
        .insert([testSubscription])
        .select()
        .single()
      
      if (insertError) {
        addResult(`❌ Insert test failed: ${insertError.message}`)
        addResult(`Insert error code: ${insertError.code}`)
        addResult(`Insert error details: ${JSON.stringify(insertError.details)}`)
      } else {
        addResult(`✅ Insert test successful - created subscription ID: ${insertData.id}`)
        
        // Clean up the test subscription
        const { error: deleteError } = await supabase
          .from('subscriptions')
          .delete()
          .eq('id', insertData.id)
        
        if (deleteError) {
          addResult(`⚠️ Cleanup failed: ${deleteError.message}`)
        } else {
          addResult('✅ Test subscription cleaned up')
        }
      }
    } catch (error) {
      addResult(`❌ RLS test failed: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const runAllTests = async () => {
    clearResults()
    addResult('Starting comprehensive database tests...')
    
    await testConnection()
    await testAuthentication()
    await testRLS()
    
    addResult('All tests completed!')
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Database Connection & Authentication Test</CardTitle>
            <CardDescription>
              Test Supabase connection, authentication, and RLS policies
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button onClick={runAllTests} disabled={loading}>
                {loading ? 'Running Tests...' : 'Run All Tests'}
              </Button>
              <Button onClick={testConnection} disabled={loading} variant="outline">
                Test Connection
              </Button>
              <Button onClick={testAuthentication} disabled={loading} variant="outline">
                Test Auth
              </Button>
              <Button onClick={testRLS} disabled={loading} variant="outline">
                Test RLS
              </Button>
              <Button onClick={clearResults} variant="outline">
                Clear Results
              </Button>
            </div>
            
            <div className="bg-card border border-border text-green-400 p-4 rounded-lg font-mono text-sm h-96 overflow-y-auto">
              {results.length === 0 ? (
                <div className="text-muted-foreground">Click "Run All Tests" to start...</div>
              ) : (
                results.map((result, index) => (
                  <div key={index} className="mb-1">
                    {result}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 