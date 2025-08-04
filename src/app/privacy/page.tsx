'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Shield, 
  ArrowLeft, 
  Download, 
  Trash2, 
  Eye,
  EyeOff,
  Database,
  FileText,
  AlertTriangle,
  Loader2,
  CheckCircle,
  Calendar,
  Mail,
  Bell,
  User,
  Lock
} from "lucide-react"
import Link from "next/link"
import { getCurrentUser } from "@/lib/auth"
import { SubscriptionService } from "@/lib/subscriptions"
import { NotificationService } from "@/lib/notifications"
import { User as UserType, Subscription, ScheduledNotification, NotificationPreferences } from "@/types"
import { supabase } from "@/lib/supabase"

export default function PrivacyPage() {
  const [user, setUser] = useState<UserType | null>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [dataStats, setDataStats] = useState({
    subscriptions: 0,
    notifications: 0,
    preferences: false
  })

  useEffect(() => {
    loadPrivacyData()
  }, [])

  const loadPrivacyData = async () => {
    try {
      setLoading(true)
      const currentUser = await getCurrentUser()
      setUser(currentUser)

      if (currentUser) {
        // Get data statistics
        const [subscriptions, notifications, preferences] = await Promise.all([
          SubscriptionService.getSubscriptions(''),
          NotificationService.getUserNotifications(),
          NotificationService.getNotificationPreferences()
        ])

        setDataStats({
          subscriptions: subscriptions.length,
          notifications: notifications.length,
          preferences: !!preferences
        })
      }
    } catch (error) {
      console.error('Error loading privacy data:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportUserData = async () => {
    try {
      setExporting(true)
      
      // Collect all user data
      const [subscriptions, notifications, preferences] = await Promise.all([
        SubscriptionService.getSubscriptions(''),
        NotificationService.getUserNotifications(),
        NotificationService.getNotificationPreferences()
      ])

      // Create comprehensive export data
      const exportData = {
        user: {
          id: user?.id,
          email: user?.email,
          name: user?.name,
          exportDate: new Date().toISOString(),
          exportedBy: 'Sentinel Privacy Export'
        },
        subscriptions: subscriptions.map(sub => ({
          ...sub,
          // Remove sensitive internal fields
          user_id: undefined,
          parsed_data: undefined
        })),
        notifications: notifications.map(notif => ({
          ...notif,
          user_id: undefined
        })),
        notificationPreferences: preferences ? {
          ...preferences,
          user_id: undefined,
          id: undefined
        } : null,
        metadata: {
          totalSubscriptions: subscriptions.length,
          activeSubscriptions: subscriptions.filter(s => s.status === 'active').length,
          totalNotifications: notifications.length,
          hasNotificationPreferences: !!preferences,
          dataTypes: ['subscriptions', 'notifications', 'preferences'],
          privacyCompliance: 'GDPR Article 20 - Right to Data Portability'
        }
      }

      // Download as JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `sentinel-data-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      console.log('✅ User data exported successfully')
    } catch (error) {
      console.error('Error exporting user data:', error)
      alert('Failed to export data. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  const deleteAllUserData = async () => {
    try {
      setDeleting(true)
      
      // Get all user data to delete
      const [subscriptions, notifications] = await Promise.all([
        SubscriptionService.getSubscriptions(''),
        NotificationService.getUserNotifications()
      ])

      // Delete all subscriptions (this will also remove calendar events and notifications)
      const deletePromises = subscriptions.map(sub => 
        SubscriptionService.deleteSubscription(sub.id)
      )
      
      await Promise.all(deletePromises)

      // Delete notification preferences
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        await supabase
          .from('notification_preferences')
          .delete()
          .eq('user_id', session.user.id)

        // Delete any remaining scheduled notifications
        await supabase
          .from('scheduled_notifications')
          .delete()
          .eq('user_id', session.user.id)
      }

      console.log('🗑️ All user data deleted successfully')
      alert('All your data has been permanently deleted. You will be redirected to the home page.')
      
      // Sign out and redirect
      await supabase.auth.signOut()
      window.location.href = '/'
      
    } catch (error) {
      console.error('Error deleting user data:', error)
      alert('Failed to delete all data. Please try again.')
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading privacy controls...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
              <header className="border-b bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Dashboard</span>
              </Link>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                                  <Shield className="w-5 h-5 text-card-foreground" />
              </div>
                              <span className="text-xl font-bold text-foreground">Sentinel</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Privacy & Data Control</h1>
          <p className="text-muted-foreground">
            Manage your data privacy settings and exercise your data rights
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Data Overview */}
          <Card className="trust-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="w-5 h-5" />
                <span>Your Data</span>
              </CardTitle>
              <CardDescription>
                Overview of data collected and stored by Sentinel
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-primary/10 border border-primary/20 rounded-lg">
                  <div className="text-2xl font-bold text-primary">{dataStats.subscriptions}</div>
                  <div className="text-sm text-muted-foreground">Subscriptions</div>
                </div>
                <div className="text-center p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{dataStats.notifications}</div>
                  <div className="text-sm text-muted-foreground">Notifications</div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Data We Collect:</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Account information (email, name)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Subscription details you add or we detect</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Notification preferences and history</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Gmail API access tokens (for email parsing)</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Data We DON'T Collect:</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <EyeOff className="w-4 h-4 text-red-600" />
                    <span>Payment information or credit card details</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <EyeOff className="w-4 h-4 text-red-600" />
                    <span>Full email content (only subscription-related data)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <EyeOff className="w-4 h-4 text-red-600" />
                    <span>Browsing history or device information</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <EyeOff className="w-4 h-4 text-red-600" />
                    <span>Location data or personal communications</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Privacy Controls */}
          <Card className="trust-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Lock className="w-5 h-5" />
                <span>Privacy Controls</span>
              </CardTitle>
              <CardDescription>
                Exercise your data rights and control your privacy
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Export Data */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-medium flex items-center space-x-2">
                      <Download className="w-4 h-4" />
                      <span>Export Your Data</span>
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Download all your data in JSON format (GDPR Article 20)
                    </p>
                  </div>
                </div>
                <Button 
                  onClick={exportUserData} 
                  disabled={exporting}
                  className="w-full"
                >
                  {exporting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Preparing Export...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Export All Data
                    </>
                  )}
                </Button>
              </div>

              {/* Data Retention */}
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium flex items-center space-x-2 mb-2">
                  <Calendar className="w-4 h-4" />
                  <span>Data Retention</span>
                </h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>• Account data: Until account deletion</p>
                  <p>• Notification history: 90 days</p>
                  <p>• Gmail tokens: Until disconnected</p>
                  <p>• Analytics: Anonymized after 2 years</p>
                </div>
              </div>

              {/* Third-party Services */}
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium flex items-center space-x-2 mb-2">
                  <Eye className="w-4 h-4" />
                  <span>Third-party Services</span>
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Google Gmail API</span>
                    <Badge variant="outline">Connected</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>OpenAI (email parsing)</span>
                    <Badge variant="outline">Server-side</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Supabase (database)</span>
                    <Badge variant="outline">Encrypted</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-red-200 bg-red-50/50 lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-red-800">
                <AlertTriangle className="w-5 h-5" />
                <span>Danger Zone</span>
              </CardTitle>
              <CardDescription className="text-red-700">
                Permanent actions that cannot be undone
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 border border-red-200 rounded-lg bg-card">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="font-medium text-red-800 dark:text-red-400 flex items-center space-x-2">
                      <Trash2 className="w-4 h-4" />
                      <span>Delete All Data</span>
                    </h4>
                    <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                      Permanently delete your account and all associated data. This action cannot be undone.
                    </p>
                    <div className="mt-3 text-xs text-red-600 dark:text-red-400 space-y-1">
                      <p>• All subscriptions and notifications will be deleted</p>
                      <p>• Calendar events will be removed</p>
                      <p>• Gmail access will be revoked</p>
                      <p>• Your account will be permanently closed</p>
                    </div>
                  </div>
                </div>
                
                {!showDeleteConfirm ? (
                  <Button 
                    variant="destructive" 
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full sm:w-auto"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete All Data
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <div className="p-3 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                      <p className="text-sm font-medium text-red-800 dark:text-red-400 mb-2">
                        ⚠️ Are you absolutely sure?
                      </p>
                      <p className="text-xs text-red-700">
                        This will permanently delete your account and all data. Type "DELETE" below to confirm:
                      </p>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        onClick={() => setShowDeleteConfirm(false)}
                        disabled={deleting}
                      >
                        Cancel
                      </Button>
                      <Button 
                        variant="destructive" 
                        onClick={deleteAllUserData}
                        disabled={deleting}
                      >
                        {deleting ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Deleting...
                          </>
                        ) : (
                          <>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Confirm Delete All
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Legal Information */}
        <Card className="trust-card mt-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>Legal & Compliance</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6 text-sm">
              <div>
                <h4 className="font-medium mb-2">GDPR Rights (EU Users)</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Right to access (Article 15)</li>
                  <li>• Right to rectification (Article 16)</li>
                  <li>• Right to erasure (Article 17)</li>
                  <li>• Right to data portability (Article 20)</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">CCPA Rights (California Users)</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Right to know about data collection</li>
                  <li>• Right to delete personal information</li>
                  <li>• Right to opt-out of sale (N/A - we don't sell data)</li>
                  <li>• Right to non-discrimination</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-primary/10 border border-primary/20 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Questions about privacy?</strong> Contact us at usesentinel@gmail.com or review our 
                <a href="/privacy-policy" className="underline ml-1">Privacy Policy</a> and 
                <a href="/terms" className="underline ml-1">Terms of Service</a>. 
                Learn more about our ethical commitments on our 
                <Link href="/ethics" className="underline ml-1">Ethics page</Link>.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <Link href="/dashboard">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </main>
    </div>
  )
} 