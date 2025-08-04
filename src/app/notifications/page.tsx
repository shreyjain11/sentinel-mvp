'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Shield, 
  ArrowLeft, 
  Bell, 
  Mail, 
  Smartphone, 
  MessageSquare, 
  Clock, 
  Settings, 
  CheckCircle, 
  AlertTriangle, 
  Send, 
  Loader2,
  ChevronDown,
  ChevronUp,
  Info,
  AlertCircle,
  Calendar,
  DollarSign,
  Zap
} from "lucide-react"
import Link from "next/link"
import { NotificationService } from '@/lib/notifications'
import { NotificationPreferences, ScheduledNotification } from '@/types'
import { useTheme } from '@/components/ThemeProvider'

// Reusable components
const InfoTooltip = ({ children, content }: { children: React.ReactNode, content: string }) => (
  <div className="group relative inline-flex items-center">
    {children}
    <div className="absolute bottom-full left-1/2 mb-2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
      <div className="bg-popover text-popover-foreground text-xs rounded-lg py-2 px-3 whitespace-nowrap border border-border shadow-lg">
        {content}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-popover"></div>
      </div>
    </div>
  </div>
)

const NotificationChannel = ({ 
  icon: Icon, 
  title, 
  description, 
  enabled, 
  onToggle, 
  disabled = false,
  color = "blue",
  testButton,
  children 
}: {
  icon: any
  title: string
  description: string
  enabled: boolean
  onToggle: (enabled: boolean) => void
  disabled?: boolean
  color?: string
  testButton?: React.ReactNode
  children?: React.ReactNode
}) => {
  const colorClasses = {
    blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:bg-blue-500/15",
    green: "bg-green-500/10 text-green-600 dark:text-green-400 group-hover:bg-green-500/15",
    purple: "bg-purple-500/10 text-purple-600 dark:text-purple-400 group-hover:bg-purple-500/15",
    orange: "bg-orange-500/10 text-orange-600 dark:text-orange-400 group-hover:bg-orange-500/15"
  }

  const getSwitchClasses = (color: string) => {
    const switchClasses = {
      blue: "data-[state=checked]:bg-blue-600 dark:data-[state=checked]:bg-blue-500",
      green: "data-[state=checked]:bg-green-600 dark:data-[state=checked]:bg-green-500", 
      purple: "data-[state=checked]:bg-purple-600 dark:data-[state=checked]:bg-purple-500",
      orange: "data-[state=checked]:bg-orange-600 dark:data-[state=checked]:bg-orange-500"
    }
    return switchClasses[color as keyof typeof switchClasses] || switchClasses.blue
  }

  return (
    <div className={`group relative overflow-hidden rounded-xl border-2 transition-all duration-300 ${
      disabled 
        ? 'border-border/40 bg-muted/30 opacity-60' 
        : enabled 
          ? 'border-border bg-card shadow-lg hover:shadow-xl' 
          : 'border-border/60 bg-card/70 hover:border-border hover:bg-card hover:shadow-md'
    }`}>
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={`flex h-12 w-12 items-center justify-center rounded-lg transition-colors border border-border/20 ${colorClasses[color as keyof typeof colorClasses]}`}>
              <Icon className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h4 className={`text-lg font-semibold ${disabled ? 'text-foreground/50' : 'text-foreground'}`}>
                  {title}
                </h4>
                {disabled && (
                  <Badge variant="outline" className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 text-xs font-medium">
                    Coming Soon
                  </Badge>
                )}
              </div>
              <p className={`text-sm leading-relaxed ${disabled ? 'text-muted-foreground/50' : 'text-muted-foreground'}`}>
                {description}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Switch
              checked={enabled}
              onCheckedChange={onToggle}
              disabled={disabled}
              className={`${getSwitchClasses(color)} data-[state=unchecked]:bg-muted hover:data-[state=unchecked]:bg-muted/80`}
            />
            {testButton && enabled && !disabled && testButton}
          </div>
        </div>
        {children && (
          <div className="mt-4 pt-4 border-t border-border/40">
            {children}
          </div>
        )}
      </div>
    </div>
  )
}

const AlertTypeToggle = ({ 
  icon: Icon, 
  title, 
  description, 
  enabled, 
  onToggle, 
  disabled = false,
  color = "blue"
}: {
  icon: any
  title: string
  description: string
  enabled: boolean
  onToggle: (enabled: boolean) => void
  disabled?: boolean
  color?: string
}) => {
  const getIconClasses = (color: string) => {
    const iconClasses = {
      blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
      green: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
      purple: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
      orange: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20"
    }
    return iconClasses[color as keyof typeof iconClasses] || iconClasses.blue
  }

  const getSwitchClasses = (color: string) => {
    const switchClasses = {
      blue: "data-[state=checked]:bg-blue-600 dark:data-[state=checked]:bg-blue-500",
      green: "data-[state=checked]:bg-green-600 dark:data-[state=checked]:bg-green-500", 
      purple: "data-[state=checked]:bg-purple-600 dark:data-[state=checked]:bg-purple-500",
      orange: "data-[state=checked]:bg-orange-600 dark:data-[state=checked]:bg-orange-500"
    }
    return switchClasses[color as keyof typeof switchClasses] || switchClasses.blue
  }

  return (
    <div className={`group flex items-center justify-between p-4 rounded-lg border-2 transition-all duration-300 ${
      disabled 
        ? 'border-border/30 bg-muted/20 opacity-60' 
        : 'border-border/50 bg-card/80 hover:border-border hover:bg-card hover:shadow-sm'
    }`}>
      <div className="flex items-center space-x-3">
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg border ${getIconClasses(color)}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <span className={`font-medium ${disabled ? 'text-foreground/50' : 'text-foreground'}`}>
            {title}
          </span>
          <p className={`text-sm ${disabled ? 'text-muted-foreground/50' : 'text-muted-foreground'}`}>
            {description}
          </p>
        </div>
      </div>
      <Switch
        checked={enabled}
        onCheckedChange={onToggle}
        disabled={disabled}
        className={`${getSwitchClasses(color)} data-[state=unchecked]:bg-muted hover:data-[state=unchecked]:bg-muted/80`}
      />
    </div>
  )
}

const CollapsibleSection = ({ 
  title, 
  description, 
  children,
  icon: Icon,
  defaultOpen = false
}: {
  title: string
  description: string
  children: React.ReactNode
  icon: any
  defaultOpen?: boolean
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="border-2 border-border/60 rounded-xl bg-card/90 hover:bg-card transition-all duration-200">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 text-left flex items-center justify-between hover:bg-muted/30 rounded-t-xl transition-colors duration-200"
      >
        <div className="flex items-center space-x-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <h4 className="font-semibold text-foreground">{title}</h4>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      {isOpen && (
        <div className="px-4 pb-4 border-t border-border/40">
          <div className="pt-4">
            {children}
          </div>
        </div>
      )}
    </div>
  )
}

export default function NotificationsPage() {
  const { theme } = useTheme()
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
        setPhoneVerification(prev => ({ ...prev, sent: true, sending: false }))
      } else {
        alert(result.message)
        setPhoneVerification(prev => ({ ...prev, sending: false }))
      }
    } catch (error) {
      console.error('Error sending phone verification:', error)
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
        setPhoneVerification(prev => ({ ...prev, confirming: false, code: '' }))
        await updatePreferences({ verified_phone: true })
      } else {
        alert(result.message)
        setPhoneVerification(prev => ({ ...prev, confirming: false }))
      }
    } catch (error) {
      console.error('Error confirming phone verification:', error)
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

  const getNotificationStatus = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'pending': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
      case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      case 'cancelled': return 'bg-muted text-muted-foreground'
      default: return 'bg-muted text-muted-foreground'
    }
  }

  // Generate dynamic summary
  const generateSummary = () => {
    if (!preferences) return "Loading notification preferences..."

    const channels = []
    if (preferences.email_enabled) channels.push("Email")
    if (preferences.sms_enabled && preferences.verified_phone) channels.push("SMS")
    
    if (channels.length === 0) return "No notification channels enabled"

    const alerts = []
    if (preferences.trial_ending_enabled) alerts.push("trial endings")
    if (preferences.renewal_reminder_enabled) alerts.push("subscription renewals")
    if (preferences.price_change_enabled) alerts.push("price changes")

    if (alerts.length === 0) return `You'll receive ${channels.join(" and ")} notifications`

    return `You'll receive ${channels.join(" and ")} reminders ${preferences.trial_end_days_before} days before ${alerts.join(", ")}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading notification settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Dashboard</span>
              </Link>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">Sentinel</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Notification Settings</h1>
          <p className="text-muted-foreground">
            Configure how and when you receive subscription alerts and reminders
          </p>
        </div>

        {/* Database Status Alert */}
        {databaseStatus && !databaseStatus.ready && (
          <div className="mb-8">
            <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-4">
                  <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400 mt-1" />
                  <div className="flex-1">
                    <h3 className="font-medium text-yellow-900 dark:text-yellow-100 mb-2">Database Setup Required</h3>
                    <p className="text-yellow-800 dark:text-yellow-200 mb-4">{databaseStatus.message}</p>
                    {databaseStatus.recommendation && (
                      <div className="bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                        <p className="text-sm text-yellow-900 dark:text-yellow-100">
                          <strong>Action Required:</strong> {databaseStatus.recommendation}
                        </p>
                        <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-2">
                          Copy and paste the SQL from <code className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">setup-notifications.sql</code> into your Supabase SQL editor.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Dynamic Summary */}
        <Card className="mb-8 border-blue-200 bg-blue-50/50 dark:bg-blue-900/20 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Bell className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-medium text-blue-900 dark:text-blue-100">Notification Summary</h3>
                <p className="text-blue-800 dark:text-blue-200">{generateSummary()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Notification Channels */}
          <div className="space-y-6">
            <Card className="border-2 border-border/60 bg-card shadow-lg hover:shadow-xl transition-all duration-200">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-2 text-foreground">
                  <Bell className="w-5 h-5 text-primary" />
                  <span>Notification Channels</span>
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Choose how you want to receive important subscription updates
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Email Notifications */}
                <NotificationChannel
                  icon={Mail}
                  title="Email Notifications"
                  description="Get important subscription updates by email"
                  enabled={preferences?.email_enabled || false}
                  onToggle={(checked) => updatePreferences({ email_enabled: checked })}
                  disabled={saving}
                  color="blue"
                  testButton={
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => sendTestNotification('email')}
                      disabled={testNotification.email.sending}
                      className="border-2 border-border/60 bg-background hover:bg-muted hover:border-border transition-all duration-200 font-medium shadow-sm hover:shadow-md"
                    >
                      {testNotification.email.sending ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : testNotification.email.sent ? (
                        <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400" />
                      ) : (
                        <Send className="h-3 w-3" />
                      )}
                    </Button>
                  }
                />

                {/* SMS Notifications */}
                <NotificationChannel
                  icon={MessageSquare}
                  title="SMS Notifications"
                  description="Receive text messages for urgent alerts"
                  enabled={preferences?.sms_enabled || false}
                  onToggle={(checked) => updatePreferences({ sms_enabled: checked })}
                  disabled={saving || !preferences?.verified_phone}
                  color="green"
                  testButton={
                    preferences?.verified_phone && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => sendTestNotification('sms')}
                        disabled={testNotification.sms.sending}
                        className="border-2 border-border/60 bg-background hover:bg-muted hover:border-border transition-all duration-200 font-medium shadow-sm hover:shadow-md"
                      >
                        {testNotification.sms.sending ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : testNotification.sms.sent ? (
                          <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400" />
                        ) : (
                          <Send className="h-3 w-3" />
                        )}
                      </Button>
                    )
                  }
                >
                  {/* Phone Number Setup */}
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <Label htmlFor="phone" className="text-sm font-medium text-foreground">
                        Phone Number
                        <InfoTooltip content="We'll send a verification code to this number">
                          <Info className="inline h-3 w-3 ml-1 text-muted-foreground hover:text-foreground transition-colors" />
                        </InfoTooltip>
                      </Label>
                      <div className="flex space-x-3">
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="(123) 456-7890"
                          value={preferences?.phone_number || ''}
                          onChange={(e) => updatePreferences({ phone_number: e.target.value })}
                          disabled={saving}
                          className="flex-1 border-2 border-border/60 bg-background hover:border-border focus:border-primary/70 focus:bg-background transition-all duration-200 placeholder:text-muted-foreground/70"
                        />
                        {preferences?.phone_number && !preferences?.verified_phone && (
                          <Button
                            variant="outline"
                            onClick={sendPhoneVerification}
                            disabled={phoneVerification.sending}
                            className="border-2 border-border/60 bg-background hover:bg-muted hover:border-border transition-all duration-200 font-medium"
                          >
                            {phoneVerification.sending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              'Verify'
                            )}
                          </Button>
                        )}
                      </div>
                      {preferences?.verified_phone && (
                        <div className="flex items-center space-x-2 text-green-600 dark:text-green-400 text-sm">
                          <CheckCircle className="h-4 w-4" />
                          <span>Phone number verified</span>
                        </div>
                      )}
                    </div>

                    {/* Verification Code */}
                    {phoneVerification.sent && !preferences?.verified_phone && (
                      <div className="space-y-3">
                        <Label htmlFor="code" className="text-sm font-medium text-foreground">
                          Verification Code
                          <InfoTooltip content="Enter the 6-digit code sent to your phone">
                            <Info className="inline h-3 w-3 ml-1 text-muted-foreground" />
                          </InfoTooltip>
                        </Label>
                        <div className="flex space-x-3">
                          <Input
                            id="code"
                            placeholder="Enter 6-digit code"
                            value={phoneVerification.code}
                            onChange={(e) => setPhoneVerification(prev => ({ ...prev, code: e.target.value }))}
                            maxLength={6}
                            className="flex-1 border-2 border-border/60 bg-background hover:border-border focus:border-primary/70 transition-all duration-200 placeholder:text-muted-foreground/70"
                          />
                          <Button
                            onClick={confirmPhoneVerification}
                            disabled={phoneVerification.confirming || phoneVerification.code.length !== 6}
                            className="border-2 border-border/60 bg-background hover:bg-muted hover:border-border transition-all duration-200 font-medium"
                          >
                            {phoneVerification.confirming ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              'Confirm'
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </NotificationChannel>

                {/* Push Notifications */}
                <NotificationChannel
                  icon={Smartphone}
                  title="Push Notifications"
                  description="Browser push notifications for instant alerts"
                  enabled={false}
                  onToggle={() => {}}
                  disabled={true}
                  color="purple"
                />
              </CardContent>
            </Card>
          </div>

          {/* Smart Alerts */}
          <Card className="border-2 border-border/60 bg-card shadow-lg hover:shadow-xl transition-all duration-200">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center space-x-2 text-foreground">
                <Zap className="w-5 h-5 text-primary" />
                <span>Smart Alerts</span>
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Choose which events trigger notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <CollapsibleSection
                title="Trial End Alerts"
                description="Get notified before your free trials expire"
                icon={Clock}
              >
                <div className="space-y-4">
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-foreground">
                      Reminder Timing
                      <InfoTooltip content="How many days before trial end to send reminders">
                        <Info className="inline h-3 w-3 ml-1 text-muted-foreground" />
                      </InfoTooltip>
                    </Label>
                                      <Select
                    value={preferences?.trial_end_days_before?.toString() || '3'}
                    onValueChange={(value) => updatePreferences({ trial_end_days_before: parseInt(value) })}
                  >
                    <SelectTrigger className="border-2 border-border/60 bg-background hover:border-border focus:border-primary/70 transition-all duration-200">
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

                  <AlertTypeToggle
                    icon={AlertCircle}
                    title="Trial Ending Alerts"
                    description="When free trials are about to end"
                    enabled={preferences?.trial_ending_enabled || false}
                    onToggle={(checked) => updatePreferences({ trial_ending_enabled: checked })}
                    disabled={saving}
                    color="orange"
                  />
                </div>
              </CollapsibleSection>

              <CollapsibleSection
                title="Renewal Reminders"
                description="Stay informed about upcoming subscription charges"
                icon={Calendar}
              >
                <div className="space-y-4">
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-foreground">
                      Reminder Timing
                      <InfoTooltip content="How many days before renewal to send reminders">
                        <Info className="inline h-3 w-3 ml-1 text-muted-foreground" />
                      </InfoTooltip>
                    </Label>
                    <Select
                      value={preferences?.renewal_days_before?.toString() || '3'}
                      onValueChange={(value) => updatePreferences({ renewal_days_before: parseInt(value) })}
                    >
                      <SelectTrigger className="border-2 border-border/60 bg-background hover:border-border focus:border-primary/70 transition-all duration-200">
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

                  <AlertTypeToggle
                    icon={Calendar}
                    title="Subscription Renewal"
                    description="Before subscriptions renew and charge"
                    enabled={preferences?.renewal_reminder_enabled || false}
                    onToggle={(checked) => updatePreferences({ renewal_reminder_enabled: checked })}
                    disabled={saving}
                    color="red"
                  />
                </div>
              </CollapsibleSection>

              <CollapsibleSection
                title="Price Change Alerts"
                description="Get notified when subscription prices change"
                icon={DollarSign}
              >
                <AlertTypeToggle
                  icon={DollarSign}
                  title="Price Changes"
                  description="When subscription prices increase"
                  enabled={preferences?.price_change_enabled || false}
                  onToggle={(checked) => updatePreferences({ price_change_enabled: checked })}
                  disabled={saving}
                  color="yellow"
                />
              </CollapsibleSection>
            </CardContent>
          </Card>
        </div>

        {/* Scheduled Notifications */}
        <Card className="premium-card mt-8">
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
                <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No scheduled notifications</h3>
                <p className="text-muted-foreground">
                  Your notification schedule will appear here when you have active subscriptions.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {scheduledNotifications.slice(0, 10).map((notification) => (
                  <div key={notification.id} className="flex items-center justify-between p-4 border border-border rounded-lg bg-card/50">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-1">
                        <h4 className="font-medium text-foreground">{notification.title}</h4>
                        <Badge className={getNotificationStatus(notification.status)}>
                          {notification.status}
                        </Badge>
                        <Badge variant="outline">
                          {notification.channel}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">{notification.message}</p>
                      <p className="text-xs text-muted-foreground/70">
                        Scheduled for: {formatScheduledDate(notification.scheduled_for)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
} 