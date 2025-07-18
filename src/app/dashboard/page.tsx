'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, Bell, Calendar, TrendingUp, Settings, LogOut, Plus, Mail, RefreshCw, Brain, BarChart3, Loader2, AlertTriangle, ExternalLink, Lock } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { getCurrentUser, signOut, getSession } from "@/lib/auth"
import { User, Subscription } from "@/types"
import { formatCurrency, getDaysUntil, getStatusColor } from "@/lib/utils"
import { GmailService } from "@/lib/gmail"
import { SubscriptionService } from "@/lib/subscriptions"
import AddSubscriptionModal from "@/components/dashboard/AddSubscriptionModal"
import { supabase } from "@/lib/supabase"
import { findCancellationInfo, getDifficultyColor, getMethodIcon } from "@/lib/cancellation-links"

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [gmailConnected, setGmailConnected] = useState(false)
  const [parsingEmails, setParsingEmails] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  
  // Filtering and sorting state
  const [filterType, setFilterType] = useState<'all' | 'trial' | 'subscription'>('all')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'cancelled' | 'expired'>('all')
  const [sortBy, setSortBy] = useState<'name' | 'amount' | 'trial_end_date' | 'renewal_date' | 'created_at'>('name')

  // Computed filtered and sorted subscriptions
  const filteredAndSortedSubscriptions = subscriptions
    .filter(subscription => {
      // Filter by type
      if (filterType !== 'all' && subscription.type !== filterType) {
        return false
      }
      
      // Filter by status
      if (filterStatus !== 'all' && subscription.status !== filterStatus) {
        return false
      }
      
      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'amount':
          return (b.amount || 0) - (a.amount || 0)
        case 'trial_end_date':
          if (!a.trial_end_date && !b.trial_end_date) return 0
          if (!a.trial_end_date) return 1
          if (!b.trial_end_date) return -1
          return new Date(a.trial_end_date).getTime() - new Date(b.trial_end_date).getTime()
        case 'renewal_date':
          if (!a.renewal_date && !b.renewal_date) return 0
          if (!a.renewal_date) return 1
          if (!b.renewal_date) return -1
          return new Date(a.renewal_date).getTime() - new Date(b.renewal_date).getTime()
        case 'created_at':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        default:
          return 0
      }
    })

  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        const session = await getSession()
        
        if (!session) {
          console.log('No session found, redirecting to auth')
          window.location.href = '/auth'
          return
        }
        
        const currentUser = await getCurrentUser()
        
        if (!currentUser) {
          console.log('No user found, redirecting to auth')
          window.location.href = '/auth'
          return
        }
        
        console.log('User authenticated:', currentUser)
        setUser(currentUser)
        
        // Check if Gmail is connected
        const gmailIsConnected = await GmailService.isGmailConnected()
        console.log('Gmail connection status:', gmailIsConnected)
        setGmailConnected(gmailIsConnected)
        
        // Load subscriptions from Supabase
        await loadSubscriptions()
      } catch (error) {
        console.error('Error initializing dashboard:', error)
        // Don't redirect on error, just log it
      } finally {
        setLoading(false)
      }
    }

    initializeDashboard()
  }, [])

  // Listen for changes when returning from OAuth flow
  useEffect(() => {
    const checkForNewConnection = async () => {
      if (user) {
        // Re-check Gmail connection status when component mounts or when user changes
        const isConnected = await GmailService.isGmailConnected()
        console.log('Re-checking Gmail connection:', isConnected)
        if (isConnected !== gmailConnected) {
          setGmailConnected(isConnected)
          if (isConnected) {
            // Reload subscriptions if Gmail was just connected
            await loadSubscriptions()
          }
        }
      }
    }

    checkForNewConnection()
  }, [user])

  // Listen for window focus to catch OAuth returns
  useEffect(() => {
    const handleFocus = async () => {
      if (user && !gmailConnected) {
        console.log('Window focused - checking Gmail connection status')
        const isConnected = await GmailService.isGmailConnected()
        if (isConnected) {
          setGmailConnected(true)
          await loadSubscriptions()
        }
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [user, gmailConnected])

  const loadSubscriptions = async () => {
    try {
      console.log('Loading subscriptions for current user')
      const userSubscriptions = await SubscriptionService.getSubscriptions('')
      setSubscriptions(userSubscriptions)
    } catch (error) {
      console.error('Error loading subscriptions:', error)
    }
  }

  const connectGmail = async () => {
    try {
      // First check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        console.error('No active session found')
        alert('Please log in first before connecting Gmail')
        window.location.href = '/auth'
        return
      }

      if (!user?.id) {
        console.error('No user ID available')
        return
      }

      setParsingEmails(true)
      
      // Connect to Gmail
      const connected = await GmailService.connectGmail()
      if (!connected) {
        throw new Error('Failed to connect to Gmail')
      }
      
      // Parse emails for subscriptions
      const parsedSubscriptions = await GmailService.parseAllEmails()
      console.log('Parsed subscriptions:', parsedSubscriptions)
      
      // Save parsed subscriptions to database
      if (parsedSubscriptions.length > 0) {
        let successCount = 0
        for (const parsed of parsedSubscriptions) {
          console.log('Creating subscription from parsed data:', parsed)
          const result = await SubscriptionService.createFromParsedData(parsed)
          if (result) {
            successCount++
          }
        }
        console.log(`Successfully created ${successCount} subscriptions`)
      }
      
      setGmailConnected(true)
      await loadSubscriptions()
    } catch (error) {
      console.error('Error connecting Gmail:', error)
      alert(`Failed to connect Gmail: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setParsingEmails(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      window.location.href = '/'
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const handleAddSubscription = () => {
    setShowAddModal(true)
  }

  const handleSubscriptionAdded = () => {
    loadSubscriptions()
  }

  const refreshGmailStatus = async () => {
    try {
      const isConnected = await GmailService.isGmailConnected()
      console.log('Manual refresh - Gmail connected:', isConnected)
      setGmailConnected(isConnected)
      if (isConnected) {
        await loadSubscriptions()
      }
    } catch (error) {
      console.error('Error refreshing Gmail status:', error)
    }
  }

  const scanGmail = async () => {
    try {
      setParsingEmails(true)
      
      // Fetch emails and parse for subscriptions
      console.log('Starting Gmail scan for subscriptions...')
      const parsedSubscriptions = await GmailService.parseAllEmails()
      console.log('Gmail scan results:', parsedSubscriptions)
      
      // Clean up any existing fake subscriptions first
      await SubscriptionService.cleanupFakeSubscriptions()

      // Save parsed subscriptions to database
      if (parsedSubscriptions.length > 0) {
        let successCount = 0
        for (const parsed of parsedSubscriptions) {
          console.log('Creating subscription from parsed data:', parsed)
          const result = await SubscriptionService.createFromParsedData(parsed)
          if (result) {
            successCount++
          }
        }
        console.log(`✅ Successfully created ${successCount} legitimate subscriptions from Gmail`)
        // Removed alert popup - just log success
      } else {
        console.log('📧 No new subscriptions found in recent emails (this is normal - most emails are not subscription confirmations)')
        // Removed alert popup - just log result
      }
      
      // Reload subscriptions to show new data
      await loadSubscriptions()
    } catch (error) {
      console.error('Error scanning Gmail:', error)
      alert(`Failed to scan Gmail: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setParsingEmails(false)
    }
  }

  const totalSpend = subscriptions.reduce((sum, sub) => sum + (sub.amount || 0), 0)
  const activeTrials = subscriptions.filter(sub => sub.type === 'trial' && sub.status === 'active').length
  const expiringSoon = subscriptions.filter(sub => {
    const daysUntil = getDaysUntil(sub.end_date)
    return daysUntil <= 7 && daysUntil > 0
  }).length

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="trust-card max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              Please sign in to access your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/auth">
              <Button className="w-full">Sign In</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">Sentinel</span>
              </div>
              
              <nav className="hidden md:flex space-x-6">
                <Link href="/dashboard" className="text-blue-600 font-medium">Dashboard</Link>
                <Link href="/calendar" className="text-gray-600 hover:text-gray-900 transition-colors">Calendar</Link>
                <Link href="/insights" className="text-gray-600 hover:text-gray-900 transition-colors">Insights</Link>
                <Link href="/notifications" className="text-gray-600 hover:text-gray-900 transition-colors">Notifications</Link>
              </nav>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" onClick={handleAddSubscription}>
                <Plus className="w-4 h-4 mr-2" />
                Add Subscription
              </Button>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user.name || user.email}!
          </h1>
          <p className="text-gray-600">
            Here's an overview of your subscriptions and trials
          </p>
        </div>

        {/* Gmail Connection Status */}
        <Card className="trust-card mb-8 border-blue-200 bg-blue-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="font-medium text-blue-900">
                    {gmailConnected ? '✅ Gmail Connected' : 'Connect Gmail to Auto-Detect Subscriptions'}
                  </h3>
                  <p className="text-sm text-blue-700">
                    {gmailConnected 
                      ? 'Your Gmail is connected and we can scan for subscriptions' 
                      : "We'll scan your emails for subscription and trial information"
                    }
                  </p>
                </div>
              </div>
              {!gmailConnected ? (
                <Button 
                  onClick={connectGmail} 
                  disabled={parsingEmails}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {parsingEmails ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Scanning Emails...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Connect Gmail
                    </>
                  )}
                </Button>
              ) : (
                <Button 
                  onClick={scanGmail} 
                  disabled={parsingEmails}
                  variant="outline"
                  className="text-green-600 border-green-600"
                >
                  {parsingEmails ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Scanning...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Scan Gmail
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Debug/Analytics Tools */}
        {gmailConnected && (
          <Card className="mb-8 border-purple-200 bg-purple-50/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Brain className="w-5 h-5 text-purple-600" />
                  <div>
                    <h3 className="font-medium text-purple-900">AI Analysis & Confidence Scoring</h3>
                    <p className="text-sm text-purple-700">
                      View detailed reasoning behind email parsing decisions and confidence scores
                    </p>
                  </div>
                </div>
                <a href="/confidence-analytics">
                  <Button variant="outline" className="text-purple-600 border-purple-600">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    View Analytics
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="trust-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Subscriptions</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{subscriptions.length}</div>
              <p className="text-xs text-muted-foreground">
                Active subscriptions and trials
              </p>
            </CardContent>
          </Card>

          <Card className="trust-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Spend</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalSpend)}</div>
              <p className="text-xs text-muted-foreground">
                Total monthly cost
              </p>
            </CardContent>
          </Card>

          <Card className="trust-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Trials</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeTrials}</div>
              <p className="text-xs text-muted-foreground">
                Trials in progress
              </p>
            </CardContent>
          </Card>

          <Card className="trust-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{expiringSoon}</div>
              <p className="text-xs text-muted-foreground">
                Within 7 days
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Subscriptions List */}
        <div className="grid lg:grid-cols-2 gap-8">
          <Card className="trust-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
              <CardTitle>Your Subscriptions</CardTitle>
              <CardDescription>
                Manage your active subscriptions and trials
              </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={handleAddSubscription}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Subscription
                  </Button>
                  <Link href="/review">
                    <Button variant="outline" size="sm">
                      <Brain className="w-4 h-4 mr-2" />
                      Review AI Parsed
                    </Button>
                  </Link>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {subscriptions.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No subscriptions yet</h3>
                  <p className="text-gray-600 mb-6">
                    Get started by connecting Gmail to automatically detect subscriptions or add them manually.
                  </p>
                  <div className="flex justify-center space-x-3">
                    {!gmailConnected && (
                      <Button onClick={connectGmail} disabled={parsingEmails}>
                        {parsingEmails ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Scanning Gmail...
                          </>
                        ) : (
                          <>
                        <Mail className="w-4 h-4 mr-2" />
                        Connect Gmail
                          </>
                        )}
                      </Button>
                    )}
                    <Button onClick={handleAddSubscription} variant={gmailConnected ? "default" : "outline"}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Manually
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Filters and Sorting */}
                  <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <label className="text-sm font-medium">Filter:</label>
                        <select 
                          className="px-3 py-1 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={filterType}
                          onChange={(e) => setFilterType(e.target.value as any)}
                        >
                          <option value="all">All</option>
                          <option value="trial">Trials Only</option>
                          <option value="subscription">Subscriptions Only</option>
                        </select>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <label className="text-sm font-medium">Status:</label>
                        <select 
                          className="px-3 py-1 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={filterStatus}
                          onChange={(e) => setFilterStatus(e.target.value as any)}
                        >
                          <option value="all">All</option>
                          <option value="active">Active</option>
                          <option value="cancelled">Cancelled</option>
                          <option value="expired">Expired</option>
                        </select>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <label className="text-sm font-medium">Sort:</label>
                        <select 
                          className="px-3 py-1 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value as any)}
                        >
                          <option value="name">Name</option>
                          <option value="amount">Price</option>
                          <option value="trial_end_date">Trial End</option>
                          <option value="renewal_date">Renewal Date</option>
                          <option value="created_at">Date Added</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      Showing {filteredAndSortedSubscriptions.length} of {subscriptions.length} subscriptions
                    </div>
                  </div>

                  {/* Subscriptions Grid */}
                  <div className="grid gap-4">
                    {filteredAndSortedSubscriptions.map((subscription) => {
                      const daysUntilTrial = subscription.trial_end_date 
                        ? getDaysUntil(subscription.trial_end_date) 
                        : null
                      const daysUntilRenewal = subscription.renewal_date 
                        ? getDaysUntil(subscription.renewal_date) 
                        : null
                      const isTrialEndingSoon = daysUntilTrial !== null && daysUntilTrial <= 3 && daysUntilTrial >= 0
                      const isRenewalSoon = daysUntilRenewal !== null && daysUntilRenewal <= 7 && daysUntilRenewal >= 0

                      return (
                        <Card key={subscription.id} className={`border transition-all hover:shadow-md ${
                          isTrialEndingSoon ? 'border-orange-200 bg-orange-50' : 
                          isRenewalSoon ? 'border-blue-200 bg-blue-50' : 
                          'border-gray-200'
                        }`}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                      <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                  <h3 className="font-semibold text-lg">{subscription.name}</h3>
                          <Badge variant={subscription.type === 'trial' ? 'warning' : 'success'}>
                            {subscription.type}
                          </Badge>
                          <Badge className={getStatusColor(subscription.status)}>
                            {subscription.status}
                          </Badge>
                                  {subscription.created_by === 'ai' && (
                                    <Badge variant="outline" className="text-xs">
                                      <Brain className="w-3 h-3 mr-1" />
                                      AI
                                    </Badge>
                                  )}
                                </div>
                                
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                  <div>
                                    <span className="text-gray-500">Service:</span>
                                    <div className="font-medium">{subscription.service}</div>
                                  </div>
                                  
                                  <div>
                                    <span className="text-gray-500">Price:</span>
                                    <div className="font-medium">{formatCurrency(subscription.amount || 0, subscription.currency)}</div>
                                    <div className="text-xs text-gray-500">{subscription.billing_cycle}</div>
                        </div>
                                  
                        {subscription.trial_end_date && (
                                    <div>
                                      <span className="text-gray-500">Trial Ends:</span>
                                      <div className={`font-medium ${isTrialEndingSoon ? 'text-orange-600' : ''}`}>
                                        {new Date(subscription.trial_end_date).toLocaleDateString()}
                                      </div>
                                      {daysUntilTrial !== null && (
                                        <div className={`text-xs ${isTrialEndingSoon ? 'text-orange-600 font-medium' : 'text-gray-500'}`}>
                                          {daysUntilTrial === 0 ? 'Today!' : 
                                           daysUntilTrial === 1 ? 'Tomorrow' : 
                                           daysUntilTrial > 0 ? `In ${daysUntilTrial} days` : 
                                           `${Math.abs(daysUntilTrial)} days ago`}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  
                                  {subscription.renewal_date && (
                                    <div>
                                      <span className="text-gray-500">Next Renewal:</span>
                                      <div className={`font-medium ${isRenewalSoon ? 'text-blue-600' : ''}`}>
                                        {new Date(subscription.renewal_date).toLocaleDateString()}
                                      </div>
                                      {daysUntilRenewal !== null && (
                                        <div className={`text-xs ${isRenewalSoon ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                                          {daysUntilRenewal === 0 ? 'Today!' : 
                                           daysUntilRenewal === 1 ? 'Tomorrow' : 
                                           daysUntilRenewal > 0 ? `In ${daysUntilRenewal} days` : 
                                           `${Math.abs(daysUntilRenewal)} days ago`}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>

                                {/* Urgent notifications */}
                                {(isTrialEndingSoon || isRenewalSoon) && (
                                  <div className="mt-3 p-2 rounded-md bg-yellow-50 border border-yellow-200">
                                    <div className="flex items-center space-x-2 text-yellow-800">
                                      <AlertTriangle className="w-4 h-4" />
                                      <span className="text-sm font-medium">
                                        {isTrialEndingSoon 
                                          ? `Trial ending ${daysUntilTrial === 0 ? 'today' : `in ${daysUntilTrial} day${daysUntilTrial === 1 ? '' : 's'}`}!`
                                          : `Renewal ${daysUntilRenewal === 0 ? 'today' : `in ${daysUntilRenewal} day${daysUntilRenewal === 1 ? '' : 's'}`}`
                                        }
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>

                              <div className="flex flex-col space-y-2 ml-4">
                                {/* Enhanced Cancel Button */}
                                {(() => {
                                  const cancellationInfo = findCancellationInfo(subscription.service)
                                  const hasOriginalUrl = subscription.cancel_url
                                  
                                  if (cancellationInfo || hasOriginalUrl) {
                                    return (
                                      <div className="space-y-1">
                                        {/* Primary cancel button */}
                                        {cancellationInfo?.cancelUrl && (
                                          <a
                                            href={cancellationInfo.cancelUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={`inline-flex items-center justify-center px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                                              cancellationInfo.difficulty === 'easy' 
                                                ? 'text-green-700 bg-green-50 border border-green-200 hover:bg-green-100'
                                                : cancellationInfo.difficulty === 'medium'
                                                ? 'text-yellow-700 bg-yellow-50 border border-yellow-200 hover:bg-yellow-100'
                                                : 'text-red-700 bg-red-50 border border-red-200 hover:bg-red-100'
                                            }`}
                                            title={cancellationInfo.instructions}
                                          >
                                            <span className="mr-1">{getMethodIcon(cancellationInfo.cancelMethod)}</span>
                                            <ExternalLink className="w-3 h-3 mr-1" />
                                            Cancel Now
                                          </a>
                                        )}
                                        
                                        {/* Alternative cancel link */}
                                        {hasOriginalUrl && (!cancellationInfo?.cancelUrl || cancellationInfo.cancelUrl !== subscription.cancel_url) && (
                                          <a
                                            href={subscription.cancel_url!}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center justify-center px-3 py-1 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100 transition-colors"
                                          >
                                            <ExternalLink className="w-3 h-3 mr-1" />
                                            Alt Cancel
                                          </a>
                                        )}
                                        
                                        {/* Show instructions for non-URL methods */}
                                        {cancellationInfo && !cancellationInfo.cancelUrl && (
                                          <div className="text-xs space-y-1">
                                            <div className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(cancellationInfo.difficulty)}`}>
                                              <span className="mr-1">{getMethodIcon(cancellationInfo.cancelMethod)}</span>
                                              {cancellationInfo.cancelMethod}
                                            </div>
                                            <div className="text-gray-600 max-w-48">
                                              {cancellationInfo.instructions}
                                            </div>
                                          </div>
                                        )}
                                        
                                        {/* Difficulty indicator */}
                                        {cancellationInfo && (
                                          <div className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(cancellationInfo.difficulty)}`}>
                                            {cancellationInfo.difficulty} to cancel
                                          </div>
                        )}
                      </div>
                                    )
                                  }
                                  
                                  return null
                                })()}
                                
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="text-xs"
                                  onClick={() => {
                                    // Handle subscription management
                                    console.log('Manage subscription:', subscription.id)
                                  }}
                                >
                                  <Settings className="w-3 h-3 mr-1" />
                        Manage
                      </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>

                  {filteredAndSortedSubscriptions.length === 0 && (
                    <div className="text-center py-8">
                      <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No subscriptions match your filters</h3>
                      <p className="text-gray-600">Try adjusting your filters to see more results.</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="trust-card">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common tasks and settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start" onClick={handleAddSubscription}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Subscription
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={refreshGmailStatus}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Gmail Status
                </Button>
                <Link href="/calendar" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Calendar className="w-4 h-4 mr-2" />
                    Sync with Calendar
                  </Button>
                </Link>
                <Link href="/notifications" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Bell className="w-4 h-4 mr-2" />
                    Notification Settings
                  </Button>
                </Link>
                <Link href="/review" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Brain className="w-4 h-4 mr-2" />
                    Review Subscriptions
                  </Button>
                </Link>
                <Link href="/privacy" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Lock className="w-4 h-4 mr-2" />
                    Privacy & Data Control
                  </Button>
                </Link>
                <Link href="/settings" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Settings className="w-4 h-4 mr-2" />
                  Account Settings
                </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Add Subscription Modal */}
      {user && (
        <AddSubscriptionModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={handleSubscriptionAdded}
          userId={user.id}
        />
      )}
    </div>
  )
} 