'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Shield, ArrowLeft, Bell, Mail, Smartphone, MessageSquare, Clock, Settings, CheckCircle, AlertTriangle, Send, Loader2 } from "lucide-react"
import Link from "next/link"
import { NotificationService } from '@/lib/notifications'
import { NotificationPreferences, ScheduledNotification } from '@/types'

export default function NotificationsPage() {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null)
  const [scheduledNotifications, setScheduledNotifications] = useState<ScheduledNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [phoneVerification, setPhoneVerification] = useState({
    sending: false,
    sent: false,
    confirming: false,
    code: ''
  })
  const [testNotification, setTestNotification] = useState({
    email: { sending: false, sent: false },
    sms: { sending: false, sent: false }
  })
  const [databaseStatus, setDatabaseStatus] = useState<{
    ready: boolean
    message: string
    recommendation?: string
  } | null>(null)

  useEffect(() => {
    loadNotificationData()
  }, [])

  const loadNotificationData = async () => {
    try {
      setLoading(true)
      
      // Check database status first
      try {
        const statusResponse = await fetch('/api/test-notifications')
        const statusData = await statusResponse.json()
        
        setDatabaseStatus({
          ready: statusData.success,
          message: statusData.message,
          recommendation: statusData.recommendation
        })
      } catch (error) {
        console.error('Error checking database status:', error)
        setDatabaseStatus({
          ready: false,
          message: 'Unable to check database status',
          recommendation: 'Please check your database connection'
        })
      }
      
      const [prefs, notifications] = await Promise.all([
        NotificationService.getNotificationPreferences(),
        NotificationService.getUserNotifications()
      ])
      
      setPreferences(prefs)
      setScheduledNotifications(notifications)
    } catch (error) {
      console.error('Error loading notification data:', error)
    } finally {
      setLoading(false)
    }
  }

  const updatePreferences = async (updates: Partial<NotificationPreferences>) => {
    if (!preferences) return

    try {
      setSaving(true)
      const newPreferences = { ...preferences, ...updates }
      setPreferences(newPreferences)

      const success = await NotificationService.updateNotificationPreferences(updates)
      if (!success) {
        // Revert on failure
        setPreferences(preferences)
        alert('Failed to update preferences')
      }
    } catch (error) {
      console.error('Error updating preferences:', error)
      setPreferences(preferences)
    } finally {
      setSaving(false)
    }
  }

  const sendPhoneVerification = async () => {
    if (!preferences?.phone_number) return

    try {
      setPhoneVerification(prev => ({ ...prev, sending: true }))
      const result = await NotificationService.sendPhoneVerification(preferences.phone_number)
      
      if (result.success) {
        setPhoneVerification(prev => ({ ...prev, sent: true }))
      } else {
        alert(result.message)
      }
    } catch (error) {
      console.error('Error sending verification:', error)
    } finally {
      setPhoneVerification(prev => ({ ...prev, sending: false }))
    }
  }

  const confirmPhoneVerification = async () => {
    if (!preferences?.phone_number || !phoneVerification.code) return

    try {
      setPhoneVerification(prev => ({ ...prev, confirming: true }))
      const result = await NotificationService.confirmPhoneVerification(
        preferences.phone_number, 
        phoneVerification.code
      )
      
      if (result.success) {
        await loadNotificationData() // Reload to get updated verification status
        setPhoneVerification({ sending: false, sent: false, confirming: false, code: '' })
      } else {
        alert(result.message)
      }
    } catch (error) {
      console.error('Error confirming verification:', error)
    } finally {
      setPhoneVerification(prev => ({ ...prev, confirming: false }))
    }
  }

  const sendTestNotification = async (channel: 'email' | 'sms') => {
    try {
      setTestNotification(prev => ({
        ...prev,
        [channel]: { sending: true, sent: false }
      }))

      const result = await NotificationService.sendTestNotification(channel)
      
      setTestNotification(prev => ({
        ...prev,
        [channel]: { sending: false, sent: result.success }
      }))

      if (!result.success) {
        alert(result.message)
      }

      // Reset after 3 seconds
      setTimeout(() => {
        setTestNotification(prev => ({
          ...prev,
          [channel]: { sending: false, sent: false }
        }))
      }, 3000)
    } catch (error) {
      console.error('Error sending test notification:', error)
      setTestNotification(prev => ({
        ...prev,
        [channel]: { sending: false, sent: false }
      }))
    }
  }

  const formatScheduledDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getNotificationStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-blue-100 text-blue-800'
      case 'failed': return 'bg-red-100 text-red-800'
      case 'cancelled': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading notification settings...</p>
        </div>
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
              <Link href="/dashboard" className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Dashboard</span>
              </Link>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">Sentinel</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Notification Settings</h1>
          <p className="text-gray-600">
            Configure how and when you receive subscription alerts and reminders
          </p>
        </div>

        {/* Database Status Alert */}
        {databaseStatus && !databaseStatus.ready && (
          <div className="mb-8">
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-4">
                  <AlertTriangle className="w-6 h-6 text-yellow-600 mt-1" />
                  <div className="flex-1">
                    <h3 className="font-medium text-yellow-900 mb-2">Database Setup Required</h3>
                    <p className="text-yellow-800 mb-4">{databaseStatus.message}</p>
                    {databaseStatus.recommendation && (
                      <div className="bg-yellow-100 border border-yellow-200 rounded-lg p-3">
                        <p className="text-sm text-yellow-900">
                          <strong>Action Required:</strong> {databaseStatus.recommendation}
                        </p>
                        <p className="text-xs text-yellow-700 mt-2">
                          Copy and paste the SQL from <code className="bg-yellow-200 px-1 rounded">setup-notifications.sql</code> into your Supabase SQL editor.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Notification Channels */}
          <Card className="trust-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="w-5 h-5" />
                <span>Notification Channels</span>
              </CardTitle>
              <CardDescription>
                Choose how you want to receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Email Notifications */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-blue-600" />
                    <div>
                      <h4 className="font-medium">Email Notifications</h4>
                      <p className="text-sm text-gray-600">Receive alerts via email</p>
                    </div>
                  </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={preferences?.email_enabled || false}
                    onCheckedChange={(checked) => updatePreferences({ email_enabled: checked })}
                    disabled={saving}
                  />
                  {preferences?.email_enabled && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => sendTestNotification('email')}
                      disabled={testNotification.email.sending}
                    >
                      {testNotification.email.sending ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : testNotification.email.sent ? (
                        <CheckCircle className="w-3 h-3" />
                      ) : (
                        <Send className="w-3 h-3" />
                      )}
                  </Button>
                  )}
                </div>
                </div>

              {/* SMS Notifications */}
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <MessageSquare className="w-5 h-5 text-green-600" />
                    <div>
                      <h4 className="font-medium">SMS Notifications</h4>
                      <p className="text-sm text-gray-600">Receive text messages</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={preferences?.sms_enabled || false}
                      onCheckedChange={(checked) => updatePreferences({ sms_enabled: checked })}
                      disabled={saving || !preferences?.verified_phone}
                    />
                    {preferences?.sms_enabled && preferences?.verified_phone && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => sendTestNotification('sms')}
                        disabled={testNotification.sms.sending}
                      >
                        {testNotification.sms.sending ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : testNotification.sms.sent ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : (
                          <Send className="w-3 h-3" />
                        )}
                  </Button>
                    )}
                  </div>
                </div>

                {/* Phone Number Setup */}
                <div className="ml-8 space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+1 (555) 123-4567"
                        value={preferences?.phone_number || ''}
                        onChange={(e) => updatePreferences({ phone_number: e.target.value })}
                        disabled={saving}
                        className="flex-1"
                      />
                      {preferences?.phone_number && !preferences?.verified_phone && (
                        <Button
                          variant="outline"
                          onClick={sendPhoneVerification}
                          disabled={phoneVerification.sending}
                        >
                          {phoneVerification.sending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            'Verify'
                          )}
                        </Button>
                      )}
                    </div>
                    {preferences?.verified_phone && (
                      <div className="flex items-center space-x-2 text-green-600 text-sm">
                        <CheckCircle className="w-4 h-4" />
                        <span>Phone number verified</span>
                      </div>
                    )}
                  </div>

                  {/* Verification Code */}
                  {phoneVerification.sent && !preferences?.verified_phone && (
                    <div className="space-y-2">
                      <Label htmlFor="code">Verification Code</Label>
                      <div className="flex space-x-2">
                        <Input
                          id="code"
                          placeholder="Enter 6-digit code"
                          value={phoneVerification.code}
                          onChange={(e) => setPhoneVerification(prev => ({ ...prev, code: e.target.value }))}
                          maxLength={6}
                          className="flex-1"
                        />
                        <Button
                          onClick={confirmPhoneVerification}
                          disabled={phoneVerification.confirming || phoneVerification.code.length !== 6}
                        >
                          {phoneVerification.confirming ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            'Confirm'
                          )}
                  </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Push Notifications */}
              <div className="flex items-center justify-between p-4 border rounded-lg opacity-50">
                <div className="flex items-center space-x-3">
                  <Smartphone className="w-5 h-5 text-purple-600" />
                  <div>
                    <h4 className="font-medium">Push Notifications</h4>
                    <p className="text-sm text-gray-600">Browser push notifications</p>
                  </div>
                </div>
                <Badge variant="outline">Coming Soon</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Notification Timing */}
          <Card className="trust-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="w-5 h-5" />
                <span>Notification Timing</span>
              </CardTitle>
              <CardDescription>
                Configure when to receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Trial End Reminders</Label>
                  <Select
                    value={preferences?.trial_end_days_before?.toString() || '3'}
                    onValueChange={(value) => updatePreferences({ trial_end_days_before: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 day before</SelectItem>
                      <SelectItem value="2">2 days before</SelectItem>
                      <SelectItem value="3">3 days before</SelectItem>
                      <SelectItem value="5">5 days before</SelectItem>
                      <SelectItem value="7">1 week before</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Renewal Reminders</Label>
                  <Select
                    value={preferences?.renewal_days_before?.toString() || '3'}
                    onValueChange={(value) => updatePreferences({ renewal_days_before: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 day before</SelectItem>
                      <SelectItem value="2">2 days before</SelectItem>
                      <SelectItem value="3">3 days before</SelectItem>
                      <SelectItem value="5">5 days before</SelectItem>
                      <SelectItem value="7">1 week before</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Alert Types</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                  <div>
                      <span className="font-medium">Trial Ending</span>
                      <p className="text-sm text-gray-600">When free trials are about to end</p>
                    </div>
                    <Switch
                      checked={preferences?.trial_ending_enabled || false}
                      onCheckedChange={(checked) => updatePreferences({ trial_ending_enabled: checked })}
                      disabled={saving}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">Subscription Renewal</span>
                      <p className="text-sm text-gray-600">Before subscriptions renew and charge</p>
                    </div>
                    <Switch
                      checked={preferences?.renewal_reminder_enabled || false}
                      onCheckedChange={(checked) => updatePreferences({ renewal_reminder_enabled: checked })}
                      disabled={saving}
                    />
                </div>

                  <div className="flex items-center justify-between">
                  <div>
                      <span className="font-medium">Price Changes</span>
                      <p className="text-sm text-gray-600">When subscription prices increase</p>
                  </div>
                    <Switch
                      checked={preferences?.price_change_enabled || false}
                      onCheckedChange={(checked) => updatePreferences({ price_change_enabled: checked })}
                      disabled={saving}
                    />
                </div>

                  <div className="flex items-center justify-between opacity-50">
                  <div>
                      <span className="font-medium">Unused Subscriptions</span>
                    <p className="text-sm text-gray-600">Detect services you're not using</p>
                    </div>
                    <Badge variant="outline">Coming Soon</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Scheduled Notifications */}
          <Card className="trust-card lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="w-5 h-5" />
                <span>Scheduled Notifications</span>
              </CardTitle>
              <CardDescription>
                View your upcoming notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              {scheduledNotifications.length === 0 ? (
                <div className="text-center py-8">
                  <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No scheduled notifications</h3>
                  <p className="text-gray-600">
                    Your notification schedule will appear here when you have active subscriptions.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {scheduledNotifications.slice(0, 10).map((notification) => (
                    <div key={notification.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-1">
                          <h4 className="font-medium">{notification.title}</h4>
                          <Badge className={getNotificationStatusColor(notification.status)}>
                            {notification.status}
                          </Badge>
                          <Badge variant="outline">
                            {notification.channel}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">{notification.message}</p>
                        <p className="text-xs text-gray-500">
                          Scheduled for: {formatScheduledDate(notification.scheduled_for)}
                        </p>
                      </div>
                    </div>
                  ))}
                  {scheduledNotifications.length > 10 && (
                    <p className="text-sm text-gray-500 text-center mt-4">
                      And {scheduledNotifications.length - 10} more notifications...
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 text-center">
          <Link href="/dashboard">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>

        {saving && (
          <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg">
            <div className="flex items-center space-x-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving preferences...</span>
            </div>
          </div>
        )}
      </main>
    </div>
  )
} 