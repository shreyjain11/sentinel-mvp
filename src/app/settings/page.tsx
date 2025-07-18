'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Calendar, 
  Bell, 
  Shield, 
  Palette, 
  Globe,
  CreditCard,
  ExternalLink,
  CheckCircle,
  XCircle,
  Settings,
  Loader2,
  Save,
  RefreshCw,
  Smartphone,
  Lock
} from "lucide-react"
import Link from "next/link"
import { getCurrentUser } from "@/lib/auth"
import { GmailService } from "@/lib/gmail"
import { CalendarService } from "@/lib/calendar"
import { supabase } from "@/lib/supabase"
import { User as UserType } from "@/types"

interface UserPreferences {
  default_currency: string
  timezone: string
  date_format: string
  theme: string
  default_billing_cycle: string
  show_amounts: boolean
  auto_categorize: boolean
  email_notifications: boolean
  compact_view: boolean
}

export default function SettingsPage() {
  const [user, setUser] = useState<UserType | null>(null)
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({
    default_currency: 'USD',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    date_format: 'MM/dd/yyyy',
    theme: 'light',
    default_billing_cycle: 'monthly',
    show_amounts: true,
    auto_categorize: true,
    email_notifications: true,
    compact_view: false
  })
  
  const [connectedServices, setConnectedServices] = useState({
    gmail: false,
    calendar: false
  })
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profileData, setProfileData] = useState({
    name: '',
    email: ''
  })

  useEffect(() => {
    loadSettingsData()
  }, [])

  const loadSettingsData = async () => {
    try {
      setLoading(true)
      
      // Get current user
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        window.location.href = '/auth'
        return
      }
      
      setUser(currentUser)
      setProfileData({
        name: currentUser.name || '',
        email: currentUser.email || ''
      })
      
      // Check connected services
      const [gmailConnected, calendarConnected] = await Promise.all([
        GmailService.isGmailConnected(),
        CalendarService.isCalendarConnected()
      ])
      
      setConnectedServices({
        gmail: gmailConnected,
        calendar: calendarConnected
      })
      
      // Load user preferences from localStorage or database
      await loadUserPreferences()
      
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadUserPreferences = async () => {
    try {
      // Try to load from localStorage first
      const savedPrefs = localStorage.getItem('user_preferences')
      if (savedPrefs) {
        const parsed = JSON.parse(savedPrefs)
        setUserPreferences({ ...userPreferences, ...parsed })
      }
    } catch (error) {
      console.error('Error loading user preferences:', error)
    }
  }

  const saveUserPreferences = async () => {
    try {
      setSaving(true)
      
      // Save to localStorage
      localStorage.setItem('user_preferences', JSON.stringify(userPreferences))
      
      console.log('✅ User preferences saved')
    } catch (error) {
      console.error('Error saving preferences:', error)
      alert('Failed to save preferences')
    } finally {
      setSaving(false)
    }
  }

  const updateProfile = async () => {
    try {
      setSaving(true)
      
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: profileData.name,
          name: profileData.name
        }
      })
      
      if (error) {
        throw error
      }
      
      // Update local user state
      if (user) {
        setUser({ ...user, name: profileData.name })
      }
      
      console.log('✅ Profile updated successfully')
      alert('Profile updated successfully!')
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const connectGmail = async () => {
    try {
      const connected = await GmailService.connectGmail()
      if (connected) {
        setConnectedServices({ ...connectedServices, gmail: true })
      }
    } catch (error) {
      console.error('Error connecting Gmail:', error)
    }
  }

  const connectCalendar = async () => {
    try {
      const connected = await CalendarService.connectCalendar()
      if (connected) {
        setConnectedServices({ ...connectedServices, calendar: true })
      }
    } catch (error) {
      console.error('Error connecting Calendar:', error)
    }
  }

  const disconnectService = async (service: 'gmail' | 'calendar') => {
    try {
      if (service === 'gmail') {
        await GmailService.disconnect()
        setConnectedServices({ ...connectedServices, gmail: false })
      } else if (service === 'calendar') {
        await CalendarService.disconnect()
        setConnectedServices({ ...connectedServices, calendar: false })
      }
    } catch (error) {
      console.error(`Error disconnecting ${service}:`, error)
    }
  }

  const refreshConnectionStatus = async () => {
    const [gmailConnected, calendarConnected] = await Promise.all([
      GmailService.isGmailConnected(),
      CalendarService.isCalendarConnected()
    ])
    
    setConnectedServices({
      gmail: gmailConnected,
      calendar: calendarConnected
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading settings...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div className="flex items-center space-x-2">
                <Settings className="w-6 h-6 text-slate-600" />
                <h1 className="text-2xl font-bold text-slate-900">Account Settings</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button 
                onClick={refreshConnectionStatus}
                variant="outline" 
                size="sm"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Status
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Profile & Account */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Profile Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span>Profile Information</span>
                </CardTitle>
                <CardDescription>
                  Update your account profile and personal information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Display Name</Label>
                  <Input
                    id="name"
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    placeholder="Enter your display name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    value={profileData.email}
                    disabled
                    className="bg-slate-50"
                  />
                  <p className="text-sm text-slate-500">
                    Email cannot be changed. Contact support if needed.
                  </p>
                </div>
                
                <Button 
                  onClick={updateProfile}
                  disabled={saving}
                  className="w-full sm:w-auto"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Update Profile
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* App Preferences */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Palette className="w-5 h-5" />
                  <span>App Preferences</span>
                </CardTitle>
                <CardDescription>
                  Customize how Sentinel works for you
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="currency">Default Currency</Label>
                    <Select
                      value={userPreferences.default_currency}
                      onValueChange={(value) => setUserPreferences({ ...userPreferences, default_currency: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                        <SelectItem value="GBP">GBP (£)</SelectItem>
                        <SelectItem value="JPY">JPY (¥)</SelectItem>
                        <SelectItem value="CAD">CAD (C$)</SelectItem>
                        <SelectItem value="AUD">AUD (A$)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="billing-cycle">Default Billing Cycle</Label>
                    <Select
                      value={userPreferences.default_billing_cycle}
                      onValueChange={(value) => setUserPreferences({ ...userPreferences, default_billing_cycle: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select
                      value={userPreferences.timezone}
                      onValueChange={(value) => setUserPreferences({ ...userPreferences, timezone: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/New_York">Eastern Time</SelectItem>
                        <SelectItem value="America/Chicago">Central Time</SelectItem>
                        <SelectItem value="America/Denver">Mountain Time</SelectItem>
                        <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                        <SelectItem value="Europe/London">London</SelectItem>
                        <SelectItem value="Europe/Paris">Paris</SelectItem>
                        <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                        <SelectItem value="Australia/Sydney">Sydney</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="date-format">Date Format</Label>
                    <Select
                      value={userPreferences.date_format}
                      onValueChange={(value) => setUserPreferences({ ...userPreferences, date_format: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MM/dd/yyyy">MM/DD/YYYY</SelectItem>
                        <SelectItem value="dd/MM/yyyy">DD/MM/YYYY</SelectItem>
                        <SelectItem value="yyyy-MM-dd">YYYY-MM-DD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="show-amounts">Show Subscription Amounts</Label>
                      <p className="text-sm text-slate-500">Display pricing information on cards</p>
                    </div>
                    <Switch
                      id="show-amounts"
                      checked={userPreferences.show_amounts}
                      onCheckedChange={(checked) => setUserPreferences({ ...userPreferences, show_amounts: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="auto-categorize">Auto-Categorize Subscriptions</Label>
                      <p className="text-sm text-slate-500">Automatically assign categories to new subscriptions</p>
                    </div>
                    <Switch
                      id="auto-categorize"
                      checked={userPreferences.auto_categorize}
                      onCheckedChange={(checked) => setUserPreferences({ ...userPreferences, auto_categorize: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="compact-view">Compact View</Label>
                      <p className="text-sm text-slate-500">Show more subscriptions with less detail</p>
                    </div>
                    <Switch
                      id="compact-view"
                      checked={userPreferences.compact_view}
                      onCheckedChange={(checked) => setUserPreferences({ ...userPreferences, compact_view: checked })}
                    />
                  </div>
                </div>

                <Button 
                  onClick={saveUserPreferences}
                  disabled={saving}
                  className="w-full sm:w-auto"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Preferences
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Connected Accounts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Globe className="w-5 h-5" />
                  <span>Connected Accounts</span>
                </CardTitle>
                <CardDescription>
                  Manage your connected services and integrations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                
                {/* Gmail Connection */}
                <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Mail className="w-8 h-8 text-red-500" />
                    <div>
                      <h3 className="font-medium">Gmail</h3>
                      <p className="text-sm text-slate-500">Email parsing and subscription detection</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {connectedServices.gmail ? (
                      <>
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Connected
                        </Badge>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => disconnectService('gmail')}
                        >
                          Disconnect
                        </Button>
                      </>
                    ) : (
                      <>
                        <Badge variant="secondary" className="bg-slate-100 text-slate-600">
                          <XCircle className="w-3 h-3 mr-1" />
                          Disconnected
                        </Badge>
                        <Button 
                          size="sm"
                          onClick={connectGmail}
                        >
                          Connect
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Calendar Connection */}
                <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-8 h-8 text-blue-500" />
                    <div>
                      <h3 className="font-medium">Google Calendar</h3>
                      <p className="text-sm text-slate-500">Automatic renewal reminders and events</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {connectedServices.calendar ? (
                      <>
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Connected
                        </Badge>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => disconnectService('calendar')}
                        >
                          Disconnect
                        </Button>
                      </>
                    ) : (
                      <>
                        <Badge variant="secondary" className="bg-slate-100 text-slate-600">
                          <XCircle className="w-3 h-3 mr-1" />
                          Disconnected
                        </Badge>
                        <Button 
                          size="sm"
                          onClick={connectCalendar}
                        >
                          Connect
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Quick Links */}
          <div className="space-y-6">
            
            {/* Account Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Account Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500">Member since</span>
                    <span className="text-sm font-medium">
                      {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500">Services connected</span>
                    <span className="text-sm font-medium">
                      {Object.values(connectedServices).filter(Boolean).length} of 2
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Settings</CardTitle>
                <CardDescription>
                  Access specialized settings pages
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/notifications" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Bell className="w-4 h-4 mr-2" />
                    Notification Settings
                    <ExternalLink className="w-3 h-3 ml-auto" />
                  </Button>
                </Link>
                
                <Link href="/privacy" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Shield className="w-4 h-4 mr-2" />
                    Privacy & Data Control
                    <ExternalLink className="w-3 h-3 ml-auto" />
                  </Button>
                </Link>
                
                <Link href="/calendar" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Calendar className="w-4 h-4 mr-2" />
                    Calendar Integration
                    <ExternalLink className="w-3 h-3 ml-auto" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Security */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Lock className="w-5 h-5" />
                  <span>Security</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium">Google OAuth</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Your account is secured with Google authentication
                  </p>
                </div>
                
                <div className="p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium">Data Encryption</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    All data is encrypted at rest and in transit
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
} 