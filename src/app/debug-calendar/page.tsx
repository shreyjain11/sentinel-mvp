'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Calendar, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Database,
  Key,
  Globe,
  User,
  Shield,
  Zap,
  RotateCcw,
  Trash2
} from 'lucide-react'

interface TokenInfo {
  access_token?: string
  refresh_token?: string
  expires_at?: string
  scope?: string
  user_id?: string
  created_at?: string
  updated_at?: string
}

interface CalendarStatus {
  connected: boolean
  hasCalendarScope: boolean
  isTokenValid: boolean
  expiresAt?: string
  scope?: string
  error?: string
}

export default function DebugCalendarPage() {
  const [loading, setLoading] = useState(true)
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null)
  const [calendarStatus, setCalendarStatus] = useState<CalendarStatus | null>(null)
  const [userInfo, setUserInfo] = useState<any>(null)
  const [subscriptionInfo, setSubscriptionInfo] = useState<any>(null)
  const [debugLogs, setDebugLogs] = useState<string[]>([])

  const addDebugLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    console.log(`[Calendar Debug] ${message}`)
    setDebugLogs(prev => [...prev, `${timestamp}: ${message}`])
  }

  useEffect(() => {
    loadDebugInfo()
  }, [])

  const loadDebugInfo = async () => {
    setLoading(true)
    addDebugLog('Starting calendar debug...')

    try {
      // Get user info
      const userResponse = await fetch('/api/debug/user-info')
      if (userResponse.ok) {
        const userData = await userResponse.json()
        setUserInfo(userData)
        addDebugLog(`User loaded: ${userData.email}`)
      } else {
        addDebugLog(`Failed to load user: ${userResponse.status}`)
      }

      // Get token info
      const tokenResponse = await fetch('/api/debug/tokens')
      if (tokenResponse.ok) {
        const tokenData = await tokenResponse.json()
        setTokenInfo(tokenData)
        addDebugLog(`Tokens loaded: ${tokenData.access_token ? 'Yes' : 'No'}`)
      } else {
        addDebugLog(`Failed to load tokens: ${tokenResponse.status}`)
      }

      // Get calendar status
      const calendarResponse = await fetch('/api/calendar/status')
      if (calendarResponse.ok) {
        const calendarData = await calendarResponse.json()
        setCalendarStatus(calendarData)
        addDebugLog(`Calendar status: ${calendarData.connected ? 'Connected' : 'Not connected'}`)
      } else {
        addDebugLog(`Failed to load calendar status: ${calendarResponse.status}`)
      }

      // Get subscription info
      const subscriptionResponse = await fetch('/api/debug/subscriptions')
      if (subscriptionResponse.ok) {
        const subscriptionData = await subscriptionResponse.json()
        setSubscriptionInfo(subscriptionData)
        addDebugLog(`Subscriptions loaded: ${subscriptionData.analysis.total} total, ${subscriptionData.analysis.eligibleForSync} eligible for sync`)
      } else {
        addDebugLog(`Failed to load subscriptions: ${subscriptionResponse.status}`)
      }

    } catch (error) {
      addDebugLog(`Error loading debug info: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const testCalendarConnection = async () => {
    addDebugLog('Testing calendar connection...')
    try {
      const response = await fetch('/api/debug/test-calendar')
      const data = await response.json()
      addDebugLog(`Calendar test result: ${data.success ? 'Success' : 'Failed'}`)
      if (data.error) {
        addDebugLog(`Calendar test error: ${data.error}`)
      }
    } catch (error) {
      addDebugLog(`Calendar test exception: ${error}`)
    }
  }

  const testTokenRefresh = async () => {
    addDebugLog('Testing token refresh...')
    try {
      const response = await fetch('/api/debug/refresh-token', { method: 'POST' })
      const data = await response.json()
      addDebugLog(`Token refresh result: ${data.success ? 'Success' : 'Failed'}`)
      if (data.error) {
        addDebugLog(`Token refresh error: ${data.error}`)
      }
    } catch (error) {
      addDebugLog(`Token refresh exception: ${error}`)
    }
  }

  const testCalendarSync = async () => {
    addDebugLog('Testing calendar sync (creating test event)...')
    try {
      const response = await fetch('/api/debug/test-calendar-sync', { method: 'POST' })
      const data = await response.json()
      addDebugLog(`Calendar sync test result: ${data.success ? 'Success' : 'Failed'}`)
      if (data.success) {
        addDebugLog(`Test event created and cleaned up successfully`)
      } else if (data.error) {
        addDebugLog(`Calendar sync error: ${data.error}`)
      }
    } catch (error) {
      addDebugLog(`Calendar sync exception: ${error}`)
    }
  }

  const testSyncProcess = async () => {
    addDebugLog('Testing complete sync process...')
    try {
      const response = await fetch('/api/debug/test-sync-process', { method: 'POST' })
      const data = await response.json()
      
      if (data.success) {
        addDebugLog(`✅ Sync process successful: ${data.message}`)
        addDebugLog(`Summary: ${data.summary.successfulEvents} events created, ${data.summary.failedEvents} failed`)
        
        // Add detailed logs
        if (data.debugLogs) {
          data.debugLogs.forEach((log: string) => {
            addDebugLog(log)
          })
        }
        
        // Show detailed results
        if (data.results) {
          data.results.forEach((result: any) => {
            if (result.success) {
              addDebugLog(`✅ ${result.subscriptionName}: Event created (${result.eventId})`)
            } else {
              addDebugLog(`❌ ${result.subscriptionName}: Failed - ${result.error || 'Unknown error'}`)
            }
          })
        }
        
        // Refresh subscription info
        const subscriptionResponse = await fetch('/api/debug/subscriptions')
        if (subscriptionResponse.ok) {
          const subscriptionData = await subscriptionResponse.json()
          setSubscriptionInfo(subscriptionData)
        }
      } else {
        addDebugLog(`❌ Sync process failed: ${data.error}`)
        if (data.debugLogs) {
          data.debugLogs.forEach((log: string) => {
            addDebugLog(log)
          })
        }
      }
    } catch (error) {
      addDebugLog(`❌ Sync process exception: ${error}`)
    }
  }

  const reconnectCalendar = async () => {
    addDebugLog('Initiating calendar reconnection...')
    try {
      // Initiate a new OAuth flow instead of redirecting to callback
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
      const redirectUri = `${window.location.origin}/auth/gmail/callback`
      const scope = 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/gmail.readonly'
      
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${clientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `response_type=code&` +
        `scope=${encodeURIComponent(scope)}&` +
        `access_type=offline&` +
        `prompt=consent`
      
      window.location.href = authUrl
    } catch (error) {
      addDebugLog(`Reconnection error: ${error}`)
    }
  }

  const clearDebugLogs = () => {
    setDebugLogs([])
  }

  const isCorruptedDate = (dateString: string | null | undefined): boolean => {
    if (!dateString) return false
    // Check for obviously corrupted dates like 0002, 0020, etc.
    const year = parseInt(dateString.split('-')[0])
    return year < 1900 || year > 2100
  }

  const updateRenewalDate = async (subscriptionId: string, renewalDate: string) => {
    try {
      addDebugLog(`Updating renewal date for subscription ${subscriptionId} to ${renewalDate}`)
      
      const response = await fetch('/api/debug/update-renewal-dates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId,
          renewalDate
        })
      })

      if (response.ok) {
        const result = await response.json()
        addDebugLog(`✅ Renewal date updated successfully`)
        
        // Refresh subscription info
        const subscriptionResponse = await fetch('/api/debug/subscriptions')
        if (subscriptionResponse.ok) {
          const subscriptionData = await subscriptionResponse.json()
          setSubscriptionInfo(subscriptionData)
        }
      } else {
        const error = await response.json()
        addDebugLog(`❌ Failed to update renewal date: ${error.message}`)
      }
    } catch (error) {
      addDebugLog(`❌ Error updating renewal date: ${error}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading debug information...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Calendar Debug</h1>
            <p className="text-gray-600">Debug Google Calendar integration issues</p>
          </div>
          <div className="flex space-x-2">
            <Button onClick={loadDebugInfo} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={clearDebugLogs} variant="outline">
              Clear Logs
            </Button>
          </div>
        </div>

        {/* User Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="w-5 h-5" />
              <span>User Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {userInfo ? (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="font-medium">Email:</span>
                  <span>{userInfo.email}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">User ID:</span>
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded">{userInfo.id}</code>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">Provider:</span>
                  <Badge variant="outline">{userInfo.provider}</Badge>
                </div>
              </div>
            ) : (
              <p className="text-red-600">No user information available</p>
            )}
          </CardContent>
        </Card>

        {/* Token Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Key className="w-5 h-5" />
              <span>OAuth Tokens</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tokenInfo ? (
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <span className="font-medium">Access Token:</span>
                  <Badge variant={tokenInfo.access_token ? "default" : "destructive"}>
                    {tokenInfo.access_token ? "Present" : "Missing"}
                  </Badge>
                  {tokenInfo.access_token && (
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {tokenInfo.access_token.substring(0, 20)}...
                    </code>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">Refresh Token:</span>
                  <Badge variant={tokenInfo.refresh_token ? "default" : "destructive"}>
                    {tokenInfo.refresh_token ? "Present" : "Missing"}
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">Expires At:</span>
                  <span>{tokenInfo.expires_at ? new Date(tokenInfo.expires_at).toLocaleString() : 'Not set'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">Scope:</span>
                  <div className="flex-1">
                    {tokenInfo.scope ? (
                      <div className="text-sm bg-gray-100 p-2 rounded">
                        {tokenInfo.scope.split(' ').map((scope, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <CheckCircle className="w-3 h-3 text-green-600" />
                            <code>{scope}</code>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-red-600">No scope defined</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">Has Calendar Scope:</span>
                  <Badge variant={
                    tokenInfo.scope && tokenInfo.scope.includes('calendar') ? "default" : "destructive"
                  }>
                    {tokenInfo.scope && tokenInfo.scope.includes('calendar') ? "Yes" : "No"}
                  </Badge>
                </div>
              </div>
            ) : (
              <p className="text-red-600">No token information available</p>
            )}
          </CardContent>
        </Card>

        {/* Calendar Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>Calendar Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {calendarStatus ? (
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <span className="font-medium">Connected:</span>
                  <Badge variant={calendarStatus.connected ? "default" : "destructive"}>
                    {calendarStatus.connected ? "Yes" : "No"}
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">Has Calendar Scope:</span>
                  <Badge variant={calendarStatus.hasCalendarScope ? "default" : "destructive"}>
                    {calendarStatus.hasCalendarScope ? "Yes" : "No"}
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">Token Valid:</span>
                  <Badge variant={calendarStatus.isTokenValid ? "default" : "destructive"}>
                    {calendarStatus.isTokenValid ? "Yes" : "No"}
                  </Badge>
                </div>
                {calendarStatus.expiresAt && (
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">Expires At:</span>
                    <span>{new Date(calendarStatus.expiresAt).toLocaleString()}</span>
                  </div>
                )}
                {calendarStatus.error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded">
                    <p className="text-red-800 text-sm">{calendarStatus.error}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-red-600">No calendar status available</p>
            )}
          </CardContent>
        </Card>

        {/* Subscription Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="w-5 h-5" />
              <span>Subscription Analysis</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {subscriptionInfo ? (
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <span className="font-medium">Total Subscriptions:</span>
                  <Badge variant="outline">{subscriptionInfo.analysis.total}</Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">Active Subscriptions:</span>
                  <Badge variant="outline">{subscriptionInfo.analysis.active}</Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">With Calendar Events:</span>
                  <Badge variant="outline">{subscriptionInfo.analysis.withCalendarEvents}</Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">Without Calendar Events:</span>
                  <Badge variant="outline">{subscriptionInfo.analysis.withoutCalendarEvents}</Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">With Renewal Dates:</span>
                  <Badge variant="outline">{subscriptionInfo.analysis.withRenewalDates}</Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">Eligible for Sync:</span>
                  <Badge variant={subscriptionInfo.analysis.eligibleForSync > 0 ? "default" : "destructive"}>
                    {subscriptionInfo.analysis.eligibleForSync}
                  </Badge>
                </div>
                {subscriptionInfo.subscriptions.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Subscription Details:</h4>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {subscriptionInfo.subscriptions.map((sub: any, index: number) => (
                        <div key={index} className="text-xs bg-gray-100 p-2 rounded">
                          <div><strong>{sub.name}</strong> - {sub.status}</div>
                          <div>Renewal: {sub.renewal_date || 'None'}</div>
                          <div>Calendar Event: {sub.calendar_event_id ? 'Yes' : 'No'}</div>
                          {(!sub.renewal_date || isCorruptedDate(sub.renewal_date)) && (
                            <div className="mt-2">
                              <input
                                type="date"
                                className="text-xs border rounded px-1 py-1 w-full"
                                placeholder="Set renewal date"
                                onChange={(e) => {
                                  if (e.target.value) {
                                    updateRenewalDate(sub.id, e.target.value)
                                  }
                                }}
                              />
                              {isCorruptedDate(sub.renewal_date) && (
                                <div className="text-xs text-red-600 mt-1">
                                  ⚠️ Corrupted date detected
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-red-600">No subscription information available</p>
            )}
          </CardContent>
        </Card>

        {/* Test Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="w-5 h-5" />
              <span>Test Actions</span>
            </CardTitle>
            <CardDescription>Test various calendar functions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Button onClick={testCalendarConnection} variant="outline">
                <Calendar className="w-4 h-4 mr-2" />
                Test Calendar Connection
              </Button>
              <Button onClick={async () => {
                addDebugLog('Testing calendar connection thoroughly...')
                try {
                  const response = await fetch('/api/debug/test-calendar-connection', { method: 'POST' })
                  const data = await response.json()
                  if (response.ok) {
                    addDebugLog(`✅ Calendar connection test successful: ${data.message}`)
                    if (data.debugLogs) {
                      data.debugLogs.forEach((log: string) => {
                        addDebugLog(log)
                      })
                    }
                  } else {
                    addDebugLog(`❌ Calendar connection test failed: ${data.error}`)
                    if (data.debugLogs) {
                      data.debugLogs.forEach((log: string) => {
                        addDebugLog(log)
                      })
                    }
                  }
                } catch (error) {
                  addDebugLog(`❌ Calendar connection test error: ${error}`)
                }
              }} variant="outline">
                <Calendar className="w-4 h-4 mr-2" />
                Test Connection Thoroughly
              </Button>
              <Button onClick={testTokenRefresh} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Test Token Refresh
              </Button>
              <Button onClick={testCalendarSync} variant="outline">
                <Calendar className="w-4 h-4 mr-2" />
                Test Calendar Sync
              </Button>
              <Button onClick={testSyncProcess} variant="outline">
                <Zap className="w-4 h-4 mr-2" />
                Test Sync Process
              </Button>
              <Button onClick={reconnectCalendar} variant="outline">
                <Globe className="w-4 h-4 mr-2" />
                Reconnect Calendar
              </Button>
              <Button onClick={async () => {
                addDebugLog('Manually triggering sync...')
                try {
                  const response = await fetch('/api/calendar/sync-all', { method: 'POST' })
                  const data = await response.json()
                  if (response.ok) {
                    addDebugLog(`✅ Manual sync successful: ${data.message}`)
                    addDebugLog(`Result: ${data.result.success} successful, ${data.result.failed} failed`)
                  } else {
                    addDebugLog(`❌ Manual sync failed: ${data.error || data.message}`)
                  }
                } catch (error) {
                  addDebugLog(`❌ Manual sync error: ${error}`)
                }
              }} variant="outline">
                <RotateCcw className="w-4 h-4 mr-2" />
                Manual Sync
              </Button>
              <Button onClick={async () => {
                addDebugLog('Cleaning up duplicate calendars...')
                try {
                  const response = await fetch('/api/debug/cleanup-calendars', { method: 'POST' })
                  const data = await response.json()
                  if (response.ok) {
                    addDebugLog(`✅ Calendar cleanup successful: ${data.message}`)
                    if (data.deletedCount > 0) {
                      addDebugLog(`Deleted ${data.deletedCount} duplicate calendars`)
                      addDebugLog(`Kept calendar: ${data.keptCalendar?.summary}`)
                    }
                    if (data.debugLogs) {
                      data.debugLogs.forEach((log: string) => {
                        addDebugLog(log)
                      })
                    }
                  } else {
                    addDebugLog(`❌ Calendar cleanup failed: ${data.error}`)
                    if (data.debugLogs) {
                      data.debugLogs.forEach((log: string) => {
                        addDebugLog(log)
                      })
                    }
                  }
                } catch (error) {
                  addDebugLog(`❌ Calendar cleanup error: ${error}`)
                }
              }} variant="outline">
                <Trash2 className="w-4 h-4 mr-2" />
                Cleanup Duplicate Calendars
              </Button>
              <Button onClick={async () => {
                addDebugLog('Testing complete calendar integration...')
                try {
                  const response = await fetch('/api/debug/test-calendar-integration', { method: 'POST' })
                  const data = await response.json()
                  if (response.ok) {
                    addDebugLog(`✅ Integration test successful: ${data.message}`)
                    if (data.debugLogs) {
                      data.debugLogs.forEach((log: string) => {
                        addDebugLog(log)
                      })
                    }
                  } else {
                    addDebugLog(`❌ Integration test failed: ${data.error}`)
                    if (data.debugLogs) {
                      data.debugLogs.forEach((log: string) => {
                        addDebugLog(log)
                      })
                    }
                  }
                } catch (error) {
                  addDebugLog(`❌ Integration test error: ${error}`)
                }
              }} variant="outline">
                <Shield className="w-4 h-4 mr-2" />
                Test Integration
              </Button>
              <Button onClick={async () => {
                addDebugLog('Testing simple sync for one subscription...')
                try {
                  const response = await fetch('/api/debug/test-simple-sync', { method: 'POST' })
                  const data = await response.json()
                  if (response.ok) {
                    addDebugLog(`✅ Simple sync successful: ${data.message}`)
                    if (data.debugLogs) {
                      data.debugLogs.forEach((log: string) => {
                        addDebugLog(log)
                      })
                    }
                    // Refresh subscription info
                    const subscriptionResponse = await fetch('/api/debug/subscriptions')
                    if (subscriptionResponse.ok) {
                      const subscriptionData = await subscriptionResponse.json()
                      setSubscriptionInfo(subscriptionData)
                    }
                  } else {
                    addDebugLog(`❌ Simple sync failed: ${data.error}`)
                    if (data.debugLogs) {
                      data.debugLogs.forEach((log: string) => {
                        addDebugLog(log)
                      })
                    }
                  }
                } catch (error) {
                  addDebugLog(`❌ Simple sync error: ${error}`)
                }
              }} variant="outline">
                <Zap className="w-4 h-4 mr-2" />
                Simple Sync Test
              </Button>
              <Button onClick={async () => {
                addDebugLog('Testing simple calendar API...')
                try {
                  const response = await fetch('/api/debug/test-simple-calendar', { method: 'POST' })
                  const data = await response.json()
                  if (response.ok) {
                    addDebugLog(`✅ Simple calendar test successful: ${data.message}`)
                    if (data.debugLogs) {
                      data.debugLogs.forEach((log: string) => {
                        addDebugLog(log)
                      })
                    }
                  } else {
                    addDebugLog(`❌ Simple calendar test failed: ${data.error}`)
                    if (data.debugLogs) {
                      data.debugLogs.forEach((log: string) => {
                        addDebugLog(log)
                      })
                    }
                  }
                } catch (error) {
                  addDebugLog(`❌ Simple calendar test error: ${error}`)
                }
              }} variant="outline">
                <Calendar className="w-4 h-4 mr-2" />
                Simple Calendar Test
              </Button>
              <Button onClick={loadDebugInfo} variant="outline">
                <Database className="w-4 h-4 mr-2" />
                Reload Debug Info
              </Button>
              <Button onClick={async () => {
                addDebugLog('Testing environment variables...')
                try {
                  const response = await fetch('/api/debug/env-test')
                  const data = await response.json()
                  if (response.ok) {
                    addDebugLog(`✅ Environment test successful`)
                    addDebugLog(`Client ID: ${data.environment.NEXT_PUBLIC_GOOGLE_CLIENT_ID}`)
                    addDebugLog(`Client Secret: ${data.environment.GOOGLE_CLIENT_SECRET}`)
                    addDebugLog(`App URL: ${data.environment.NEXT_PUBLIC_APP_URL}`)
                    addDebugLog(`Client ID length: ${data.clientIdLength}`)
                    addDebugLog(`Client Secret length: ${data.clientSecretLength}`)
                  } else {
                    addDebugLog(`❌ Environment test failed: ${data.error}`)
                  }
                } catch (error) {
                  addDebugLog(`❌ Environment test error: ${error}`)
                }
              }} variant="outline">
                <Key className="w-4 h-4 mr-2" />
                Test Env Vars
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Debug Logs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5" />
              <span>Debug Logs</span>
            </CardTitle>
            <CardDescription>Real-time debug information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-64 overflow-y-auto">
              {debugLogs.length === 0 ? (
                <p className="text-gray-500">No debug logs yet. Try running some tests.</p>
              ) : (
                debugLogs.map((log, index) => (
                  <div key={index} className="mb-1">
                    {log}
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