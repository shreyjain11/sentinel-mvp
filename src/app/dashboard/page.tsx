'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Bell, Calendar, TrendingUp, Settings, LogOut, Plus, Mail, RefreshCw, Brain, BarChart3, Loader2, AlertTriangle, ExternalLink, Lock, Info, Eye } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { getCurrentUser, signOut, getSession } from "@/lib/auth"
import { User, Subscription } from "@/types"
import { formatCurrency, getDaysUntil, getStatusColor } from "@/lib/utils"
import { GmailService } from "@/lib/gmail"
import { SubscriptionService } from "@/lib/subscriptions"
import EnhancedAddSubscriptionModal from "@/components/dashboard/EnhancedAddSubscriptionModal"
import { supabase } from "@/lib/supabase"
import { findCancellationInfo, getDifficultyColor, getMethodIcon } from "@/lib/cancellation-links"
import { ThemeToggle } from "@/components/ThemeProvider"
import { StatCard } from "@/components/dashboard/StatCard"
import { Tag } from "@/components/dashboard/Tag"
import { AiInsightCard } from "@/components/dashboard/AiInsightCard"
import { SidebarActions } from "@/components/dashboard/SidebarActions"
import { TrustManifesto } from "@/components/TrustManifesto"
import { ContractLockInDetector } from "@/components/ContractLockInDetector"
import { TransparencyPanel } from "@/components/TransparencyPanel"

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [gmailConnected, setGmailConnected] = useState(false)
  const [parsingEmails, setParsingEmails] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null)
  const [showTransparencyPanel, setShowTransparencyPanel] = useState(false)
  
  // Filtering and sorting state
  const [filterType, setFilterType] = useState<'all' | 'trial' | 'subscription'>('all')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'cancelled' | 'expired'>('all')
  const [sortBy, setSortBy] = useState<'name' | 'amount' | 'trial_end_date' | 'renewal_date' | 'created_at'>('name')

  // Computed filtered and sorted subscriptions
  const filteredAndSortedSubscriptions = subscriptions
    .filter(subscription => {
      if (filterType !== 'all' && subscription.type !== filterType) return false
      if (filterStatus !== 'all' && subscription.status !== filterStatus) return false
      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name': return a.name.localeCompare(b.name)
        case 'amount': return (b.amount || 0) - (a.amount || 0)
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
        case 'created_at': return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        default: return 0
      }
    })

  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        const session = await getSession()
        if (!session) {
          window.location.href = '/auth'
          return
        }
        
        const currentUser = await getCurrentUser()
        if (!currentUser) {
          window.location.href = '/auth'
          return
        }
        
        setUser(currentUser)
        const gmailIsConnected = await GmailService.isGmailConnected()
        setGmailConnected(gmailIsConnected)
        await loadSubscriptions()
      } catch (error) {
        console.error('Error initializing dashboard:', error)
      } finally {
        setLoading(false)
      }
    }

    initializeDashboard()
  }, [])

  useEffect(() => {
    const checkForNewConnection = async () => {
      if (user) {
        const isConnected = await GmailService.isGmailConnected()
        if (isConnected !== gmailConnected) {
          setGmailConnected(isConnected)
          if (isConnected) {
            await loadSubscriptions()
          }
        }
      }
    }

    checkForNewConnection()
  }, [user])

  useEffect(() => {
    const handleFocus = async () => {
      if (user && !gmailConnected) {
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
      const userSubscriptions = await SubscriptionService.getSubscriptions('')
      setSubscriptions(userSubscriptions)
    } catch (error) {
      console.error('Error loading subscriptions:', error)
    }
  }

  const connectGmail = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        alert('Please log in first before connecting Gmail')
        window.location.href = '/auth'
        return
      }

      if (!user?.id) return

      setParsingEmails(true)
      const connected = await GmailService.connectGmail()
      if (!connected) throw new Error('Failed to connect to Gmail')
      
      const parsedSubscriptions = await GmailService.parseAllEmails()
      if (parsedSubscriptions.length > 0) {
        let successCount = 0
        for (const parsed of parsedSubscriptions) {
          const result = await SubscriptionService.createFromParsedData(parsed)
          if (result) successCount++
        }
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

  const handleAddSubscription = () => setShowAddModal(true)
  const handleSubscriptionAdded = () => loadSubscriptions()

  const refreshGmailStatus = async () => {
    try {
      const isConnected = await GmailService.isGmailConnected()
      setGmailConnected(isConnected)
      if (isConnected) await loadSubscriptions()
    } catch (error) {
      console.error('Error refreshing Gmail status:', error)
    }
  }

  const scanGmail = async () => {
    try {
      setParsingEmails(true)
      const parsedSubscriptions = await GmailService.parseAllEmails()
      await SubscriptionService.cleanupFakeSubscriptions()

      if (parsedSubscriptions.length > 0) {
        let successCount = 0
        for (const parsed of parsedSubscriptions) {
          const result = await SubscriptionService.createFromParsedData(parsed)
          if (result) successCount++
        }
      }
      
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="premium-card max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please sign in to access your dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/auth">
              <Button className="w-full premium-button">Sign In</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-premium-purple rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-card-foreground" />
                </div>
                <span className="text-xl font-bold text-foreground">Sentinel</span>
              </div>
              
              <nav className="hidden md:flex space-x-6">
                <Link href="/dashboard" className="text-primary font-semibold hover:text-primary/80 transition-colors">Dashboard</Link>
                <Link href="/calendar" className="text-muted-foreground hover:text-foreground transition-colors">Calendar</Link>
                <Link href="/insights" className="text-muted-foreground hover:text-foreground transition-colors">Insights</Link>
                <Link href="/notifications" className="text-muted-foreground hover:text-foreground transition-colors">Notifications</Link>
                <Link href="/ethics" className="text-muted-foreground hover:text-foreground transition-colors">Ethics</Link>
              </nav>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm" onClick={handleAddSubscription} className="premium-button-outline">
                <Plus className="w-4 h-4 mr-2" />
                Add Subscription
              </Button>
              <ThemeToggle />
              <Button variant="outline" size="sm" onClick={handleSignOut} className="premium-button-outline">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2 leading-tight">
            Welcome back, <span className="text-primary">{user.name || user.email}</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Your AI-powered subscription command center
          </p>
        </div>

        {/* Gmail Connection Status */}
        <Card className="premium-card mb-6">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-primary" />
                <div>
                  <h3 className="text-base font-semibold text-foreground">
                    {gmailConnected ? 'Gmail Connected' : 'Connect Gmail to Auto-Detect Subscriptions'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
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
                  className="premium-button"
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
                  className="premium-button-outline"
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

        {/* AI Analytics Card */}
        {gmailConnected && (
          <div className="mb-6">
            <AiInsightCard
              title="AI Analysis & Confidence Scoring"
              description="View detailed reasoning behind email parsing decisions and confidence scores"
              confidence={95}
              actionLabel="View Analytics"
              onAction={() => window.open('/confidence-analytics', '_blank')}
              variant="insight"
            />
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Total Subscriptions"
            value={subscriptions.length}
            description="Active subscriptions and trials"
            icon={Shield}
          />
          <StatCard
            title="Monthly Spend"
            value={formatCurrency(totalSpend)}
            description="Total monthly cost"
            icon={TrendingUp}
          />
          <StatCard
            title="Active Trials"
            value={activeTrials}
            description="Trials in progress"
            icon={Bell}
          />
          <StatCard
            title="Expiring Soon"
            value={expiringSoon}
            description="Within 7 days"
            icon={Calendar}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Subscriptions List */}
          <div className="lg:col-span-2">
            <Card className="premium-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-bold text-foreground">Your Subscriptions</CardTitle>
                    <CardDescription className="text-muted-foreground">
                      Manage your active subscriptions and trials
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={handleAddSubscription} className="premium-button-outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Subscription
                    </Button>
                    <Link href="/review">
                      <Button variant="outline" size="sm" className="premium-button-outline">
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
                    <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No subscriptions yet</h3>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                      Get started by connecting Gmail to automatically detect subscriptions or add them manually.
                    </p>
                    <div className="flex justify-center space-x-3">
                      {!gmailConnected && (
                        <Button onClick={connectGmail} disabled={parsingEmails} className="premium-button">
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
                      <Button onClick={handleAddSubscription} variant={gmailConnected ? "default" : "outline"} className="premium-button-outline">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Manually
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Filters and Sorting */}
                    <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <label className="text-sm font-medium text-foreground">Filter:</label>
                          <select 
                            className="px-3 py-1.5 bg-card border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value as any)}
                          >
                            <option value="all">All</option>
                            <option value="trial">Trials Only</option>
                            <option value="subscription">Subscriptions Only</option>
                          </select>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <label className="text-sm font-medium text-foreground">Status:</label>
                          <select 
                            className="px-3 py-1.5 bg-card border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
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
                          <label className="text-sm font-medium text-foreground">Sort:</label>
                          <select 
                            className="px-3 py-1.5 bg-card border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
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
                      
                      <div className="text-sm text-muted-foreground">
                        Showing {filteredAndSortedSubscriptions.length} of {subscriptions.length} subscriptions
                      </div>
                    </div>

                    {/* Subscriptions Grid */}
                    <div className="space-y-3">
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
                          <Card key={subscription.id} className={`premium-card ${
                            isTrialEndingSoon || isRenewalSoon ? 'ring-1 ring-amber-500/30' : ''
                          }`}>
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-3">
                                    <h3 className="text-lg font-semibold text-foreground">{subscription.name}</h3>
                                    <Tag variant={subscription.type === 'trial' ? 'trial' : 'subscription'}>
                                      {subscription.type}
                                    </Tag>
                                    <Tag variant={subscription.status as any}>
                                      {subscription.status}
                                    </Tag>
                                    {subscription.created_by === 'ai' && (
                                      <Tag variant="ai">AI</Tag>
                                    )}
                                    {/* Trust badges */}
                                    <Tag variant="no-contract">No Contracts</Tag>
                                    <Tag variant="manual-only">Manual Only</Tag>
                                  </div>
                                  
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                    <div>
                                      <span className="text-muted-foreground">Service:</span>
                                      <div className="font-medium text-foreground">{subscription.service}</div>
                                    </div>
                                    
                                    <div>
                                      <span className="text-muted-foreground">Price:</span>
                                      <div className="font-medium text-foreground">{formatCurrency(subscription.amount || 0, subscription.currency)}</div>
                                      <div className="text-xs text-muted-foreground">{subscription.billing_cycle}</div>
                                    </div>
                                    
                                    {subscription.trial_end_date && (
                                      <div>
                                        <span className="text-muted-foreground">Trial Ends:</span>
                                        <div className={`font-medium ${isTrialEndingSoon ? 'text-amber-600 dark:text-amber-400' : 'text-foreground'}`}>
                                          {new Date(subscription.trial_end_date).toLocaleDateString()}
                                        </div>
                                        {daysUntilTrial !== null && (
                                          <div className={`text-xs ${isTrialEndingSoon ? 'text-amber-600 dark:text-amber-400 font-medium' : 'text-muted-foreground'}`}>
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
                                        <span className="text-muted-foreground">Next Renewal:</span>
                                        <div className={`font-medium ${isRenewalSoon ? 'text-primary' : 'text-foreground'}`}>
                                          {new Date(subscription.renewal_date).toLocaleDateString()}
                                        </div>
                                        {daysUntilRenewal !== null && (
                                          <div className={`text-xs ${isRenewalSoon ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
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
                                    <div className="mt-3 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                      <div className="flex items-center space-x-2 text-amber-700 dark:text-amber-300">
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

                                  {/* Contract Lock-In Detector */}
                                  <div className="mt-3">
                                    <ContractLockInDetector subscription={subscription} />
                                  </div>

                                  {/* Transparency Panel for AI-detected subscriptions */}
                                  {subscription.created_by === 'ai' && (
                                    <div className="mt-3">
                                      <TransparencyPanel subscription={subscription} />
                                    </div>
                                  )}
                                </div>

                                <div className="flex flex-col space-y-2 ml-4">
                                  {/* Enhanced Cancel Button with Tooltip */}
                                  {(() => {
                                    const cancellationInfo = findCancellationInfo(subscription.service)
                                    const hasOriginalUrl = subscription.cancel_url
                                    
                                    if (cancellationInfo || hasOriginalUrl) {
                                      return (
                                        <div className="space-y-2">
                                          {cancellationInfo?.cancelUrl && (
                                            <div className="tooltip-trigger relative">
                                              <a
                                                href={cancellationInfo.cancelUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={`inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                                                  cancellationInfo.difficulty === 'easy' 
                                                    ? 'text-green-600 dark:text-green-400 bg-green-500/10 border border-green-500/20 hover:bg-green-500/20'
                                                    : cancellationInfo.difficulty === 'medium'
                                                    ? 'text-yellow-600 dark:text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 hover:bg-yellow-500/20'
                                                    : 'text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20'
                                                }`}
                                                title={cancellationInfo.instructions}
                                              >
                                                <span className="mr-1">{getMethodIcon(cancellationInfo.cancelMethod)}</span>
                                                <ExternalLink className="w-3 h-3 mr-1" />
                                                Cancel Now
                                              </a>
                                              <div className="tooltip">
                                                We never cancel on your behalf. You control every action.
                                              </div>
                                            </div>
                                          )}
                                          
                                          {hasOriginalUrl && (!cancellationInfo?.cancelUrl || cancellationInfo.cancelUrl !== subscription.cancel_url) && (
                                            <a
                                              href={subscription.cancel_url!}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium text-muted-foreground bg-muted border border-border rounded-md hover:bg-muted/80 transition-colors"
                                            >
                                              <ExternalLink className="w-3 h-3 mr-1" />
                                              Alt Cancel
                                            </a>
                                          )}
                                          
                                          {cancellationInfo && !cancellationInfo.cancelUrl && (
                                            <div className="text-xs space-y-1">
                                              <div className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(cancellationInfo.difficulty)}`}>
                                                <span className="mr-1">{getMethodIcon(cancellationInfo.cancelMethod)}</span>
                                                {cancellationInfo.cancelMethod}
                                              </div>
                                              <div className="text-muted-foreground max-w-40">
                                                {cancellationInfo.instructions}
                                              </div>
                                            </div>
                                          )}
                                          
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
                                    className="text-sm premium-button-outline"
                                    onClick={() => {
                                      console.log('Manage subscription:', subscription.id)
                                    }}
                                  >
                                    <Settings className="w-4 h-4 mr-2" />
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
                        <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                        <h3 className="text-lg font-semibold text-foreground mb-2">No subscriptions match your filters</h3>
                        <p className="text-muted-foreground">Try adjusting your filters to see more results.</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Actions */}
          <div className="lg:col-span-1">
            <div className="sticky-sidebar">
              <SidebarActions
                onAddSubscription={handleAddSubscription}
                onRefreshGmail={refreshGmailStatus}
                onScanGmail={scanGmail}
                gmailConnected={gmailConnected}
              />
              
              {/* Trust Manifesto Sidebar */}
              <div className="mt-4">
                <TrustManifesto variant="sidebar" />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Add Subscription Modal */}
      {user && (
        <EnhancedAddSubscriptionModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={handleSubscriptionAdded}
          userId={user.id}
        />
      )}
    </div>
  )
} 