'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { 
  Shield, 
  ArrowLeft, 
  Calendar as CalendarIcon, 
  RefreshCw, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  RefreshCcw, 
  CreditCard, 
  Bell,
  Settings,
  ExternalLink,
  Play,
  Pause,
  Zap,
  X,
  Plus,
  Info,
  CalendarDays,
  RotateCcw,
  ChevronDown,
  ChevronUp
} from "lucide-react"
import Link from "next/link"
import { CalendarService, CalendarEvent } from '@/lib/calendar'
import { formatCurrency } from '@/lib/utils'

interface CalendarPreferences {
  autoSync: boolean
  syncTrials: boolean
  syncRenewals: boolean
  showCanceled: boolean
}

export default function CalendarPage() {
  const [calendarConnected, setCalendarConnected] = useState(false)
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [lastSynced, setLastSynced] = useState<string | null>(null)
  const [showPreferences, setShowPreferences] = useState(false)
  const [preferences, setPreferences] = useState<CalendarPreferences>({
    autoSync: true,
    syncTrials: true,
    syncRenewals: true,
    showCanceled: false
  })

  useEffect(() => {
    checkCalendarStatus()
    loadEvents()
    loadPreferences()
  }, [])

  // Check for URL parameters that indicate successful OAuth
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('connected') === 'true') {
      window.history.replaceState({}, '', window.location.pathname)
      checkCalendarStatus()
    }
  }, [])

  const checkCalendarStatus = async () => {
    try {
      const connected = await CalendarService.isCalendarConnected()
      console.log('Calendar connection status:', connected)
      setCalendarConnected(connected)
      // Always load events, regardless of connection status
      await loadEvents()
    } catch (error) {
      console.error('Error checking calendar status:', error)
      setCalendarConnected(false)
    } finally {
      setLoading(false)
    }
  }

  const loadPreferences = async () => {
    try {
      const response = await fetch('/api/calendar/preferences')
      if (response.ok) {
        const data = await response.json()
        setPreferences(data.preferences)
        setLastSynced(data.lastSynced)
      }
    } catch (error) {
      console.error('Error loading preferences:', error)
    }
  }

  const savePreferences = async (newPreferences: CalendarPreferences) => {
    try {
      const response = await fetch('/api/calendar/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences: newPreferences })
      })
      if (response.ok) {
        setPreferences(newPreferences)
      }
    } catch (error) {
      console.error('Error saving preferences:', error)
    }
  }

  const refreshStatus = async () => {
    setLoading(true)
    await checkCalendarStatus()
    await loadEvents()
    await loadPreferences()
  }

  const loadEvents = async () => {
    try {
      const upcomingEvents = await CalendarService.getUpcomingEvents()
      console.log('Loaded upcoming events:', upcomingEvents)
      setEvents(upcomingEvents)
    } catch (error) {
      console.error('Error loading events:', error)
      setEvents([])
    }
  }

  const connectCalendar = async () => {
    try {
      setLoading(true)
      await CalendarService.connectCalendar()
    } catch (error) {
      console.error('Error connecting calendar:', error)
    } finally {
      setLoading(false)
    }
  }

  const syncToCalendar = async () => {
    try {
      setSyncing(true)
      setSyncError(null)
      
      const response = await fetch('/api/calendar/sync-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        if (response.status === 400 && result.error === 'Calendar not connected') {
          setSyncError('Please connect your Google Calendar first')
        } else {
          setSyncError(result.message || 'Failed to sync calendar')
        }
        return
      }
      
      console.log(`Synced ${result.result.success} events to Google Calendar`)
      await loadEvents()
      await loadPreferences()
      
      // Show success toast
      showToast(`Successfully synced ${result.result.success} events!`, 'success')
    } catch (error) {
      console.error('Error syncing to calendar:', error)
      setSyncError('Failed to sync calendar. Please try again.')
    } finally {
      setSyncing(false)
    }
  }

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    // Simple toast implementation
    const toast = document.createElement('div')
    toast.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
      type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
    }`
    toast.textContent = message
    document.body.appendChild(toast)
    setTimeout(() => document.body.removeChild(toast), 3000)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getDaysUntil = (dateString: string) => {
    const eventDate = new Date(dateString)
    const today = new Date()
    const diffTime = eventDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getRelativeDate = (dateString: string) => {
    const daysUntil = getDaysUntil(dateString)
    if (daysUntil === 0) return 'Today'
    if (daysUntil === 1) return 'Tomorrow'
    if (daysUntil > 0) return `In ${daysUntil} days`
    return `${Math.abs(daysUntil)} days ago`
  }

  const getEventIcon = (type: 'renewal' | 'trial_end') => {
    return type === 'renewal' ? <CreditCard className="w-4 h-4" /> : <Clock className="w-4 h-4" />
  }

  const getEventColor = (type: 'renewal' | 'trial_end') => {
    return type === 'renewal' 
      ? 'bg-red-100 text-red-800 border-red-200' 
      : 'bg-blue-100 text-blue-800 border-blue-200'
  }

  const getServiceIcon = (serviceName: string) => {
    // Simple service icon mapping
    const serviceIcons: { [key: string]: string } = {
      'netflix': '🎬',
      'spotify': '🎵',
      'amazon': '📦',
      'google': '🔍',
      'microsoft': '🪟',
      'apple': '🍎',
      'adobe': '🎨',
      'dropbox': '📁',
      'slack': '💬',
      'zoom': '📹'
    }
    
    const service = serviceName.toLowerCase()
    for (const [key, icon] of Object.entries(serviceIcons)) {
      if (service.includes(key)) return icon
    }
    return '📱' // Default icon
  }

  const openInGoogleCalendar = (eventId: string) => {
    if (eventId) {
      window.open(`https://calendar.google.com/calendar/event?eid=${eventId}`, '_blank')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading calendar...</p>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Calendar Integration</h1>
          <p className="text-gray-600">
            Sync your subscription renewals and trial end dates with Google Calendar
          </p>
        </div>

        {/* Calendar Connection Status */}
        <Card className={`mb-6 ${calendarConnected ? 'border-green-200 bg-green-50/50' : 'border-yellow-200 bg-yellow-50/50'}`}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CalendarIcon className={`w-5 h-5 ${calendarConnected ? 'text-green-600' : 'text-yellow-600'}`} />
                <div>
                  <h3 className={`font-medium ${calendarConnected ? 'text-green-900' : 'text-yellow-900'}`}>
                    {calendarConnected ? 'Google Calendar Connected' : 'Connect Google Calendar'}
                  </h3>
                  <p className={`text-sm ${calendarConnected ? 'text-green-700' : 'text-yellow-700'}`}>
                    {calendarConnected 
                      ? 'Your subscription events can be synced to Google Calendar' 
                      : 'Connect your Google Calendar to automatically create reminders for renewals and trial endings'
                    }
                  </p>
                  {lastSynced && (
                    <p className="text-xs text-green-600 mt-1">
                      Last synced: {new Date(lastSynced).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex space-x-2">
                {!calendarConnected ? (
                  <>
                    <Button onClick={connectCalendar} disabled={loading}>
                      <CalendarIcon className="w-4 h-4 mr-2" />
                      Connect Calendar
                    </Button>
                    <Button onClick={refreshStatus} disabled={loading} variant="outline" size="sm">
                      <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button onClick={syncToCalendar} disabled={syncing} variant="outline">
                      {syncing ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Syncing...
                        </>
                      ) : (
                        <>
                          <RotateCcw className="w-4 h-4 mr-2" />
                          Sync Now
                        </>
                      )}
                    </Button>
                    <Button 
                      onClick={() => setShowPreferences(!showPreferences)} 
                      variant="outline" 
                      size="sm"
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                    <Button onClick={refreshStatus} disabled={loading} variant="outline" size="sm">
                      <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sync Preferences Modal */}
        {showPreferences && (
          <Card className="mb-6 border-blue-200 bg-blue-50/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-blue-900">Sync Preferences</h3>
                <Button 
                  onClick={() => setShowPreferences(false)} 
                  variant="outline" 
                  size="sm"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">Auto-sync new subscriptions</Label>
                    <p className="text-xs text-gray-600">Automatically sync new confirmed subscriptions to calendar</p>
                  </div>
                  <Switch 
                    checked={preferences.autoSync}
                    onCheckedChange={(checked) => savePreferences({ ...preferences, autoSync: checked })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">Sync trial endings</Label>
                    <p className="text-xs text-gray-600">Create calendar events for trial end dates</p>
                  </div>
                  <Switch 
                    checked={preferences.syncTrials}
                    onCheckedChange={(checked) => savePreferences({ ...preferences, syncTrials: checked })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">Sync renewals</Label>
                    <p className="text-xs text-gray-600">Create calendar events for subscription renewals</p>
                  </div>
                  <Switch 
                    checked={preferences.syncRenewals}
                    onCheckedChange={(checked) => savePreferences({ ...preferences, syncRenewals: checked })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">Show canceled subscriptions</Label>
                    <p className="text-xs text-gray-600">Include canceled subscriptions in calendar events</p>
                  </div>
                  <Switch 
                    checked={preferences.showCanceled}
                    onCheckedChange={(checked) => savePreferences({ ...preferences, showCanceled: checked })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Message */}
        {syncError && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <div>
                  <h3 className="font-medium text-red-900">Sync Error</h3>
                  <p className="text-sm text-red-700">{syncError}</p>
                </div>
                <Button 
                  onClick={() => setSyncError(null)} 
                  variant="outline" 
                  size="sm"
                  className="ml-auto"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Calendar Settings Bar */}
        {calendarConnected && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                  <div>
                    <h3 className="font-medium">Sentinel Calendar</h3>
                    <p className="text-sm text-gray-600">Your dedicated subscription calendar</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <CalendarDays className="w-4 h-4 mr-2" />
                    Change Calendar
                  </Button>
                  <Button variant="outline" size="sm">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reconnect
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upcoming Events */}
        <Card className="trust-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CalendarDays className="w-5 h-5" />
              <span>Upcoming Events</span>
              {events.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {events.length} events
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Your subscription renewals and trial end dates
            </CardDescription>
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CalendarIcon className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No subscriptions synced yet</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Start by parsing emails or syncing your existing subscriptions to see them here.
                </p>
                <div className="flex justify-center space-x-3">
                  <Button onClick={syncToCalendar} disabled={!calendarConnected || syncing}>
                    {syncing ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Syncing...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 mr-2" />
                        Sync Now
                      </>
                    )}
                  </Button>
                  <Link href="/dashboard">
                    <Button variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Subscription
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {events.slice(0, 10).map((event) => {
                  const daysUntil = getDaysUntil(event.start)
                  const isUrgent = daysUntil <= 3
                  const isPast = daysUntil < 0
                  
                  return (
                    <div key={event.id} className="group relative p-4 border rounded-lg hover:bg-gray-50 transition-all duration-200 hover:shadow-sm">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            <span className="text-2xl">{getServiceIcon(event.title)}</span>
                            <div className="flex-1">
                              <h3 className="font-medium text-gray-900">{event.title}</h3>
                              <p className="text-sm text-gray-600">{event.description}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2 mb-2">
                            <Badge className={getEventColor(event.type)}>
                              {getEventIcon(event.type)}
                              <span className="ml-1">{event.type === 'renewal' ? 'Renewal' : 'Trial End'}</span>
                            </Badge>
                            
                            {isUrgent && !isPast && (
                              <Badge variant="destructive" className="animate-pulse">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                Urgent
                              </Badge>
                            )}
                            
                            {event.calendarEventId && (
                              <Badge variant="outline" className="text-green-600 border-green-200">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Synced
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <div className="flex items-center space-x-1">
                              <CalendarIcon className="w-4 h-4" />
                              <span>{formatDate(event.start)}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="w-4 h-4" />
                              <span className={isUrgent && !isPast ? 'text-red-600 font-medium' : ''}>
                                {getRelativeDate(event.start)}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {event.calendarEventId && (
                            <Button 
                              onClick={() => openInGoogleCalendar(event.calendarEventId!)} 
                              variant="outline" 
                              size="sm"
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          )}
                          <Button variant="outline" size="sm">
                            <RefreshCw className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
                
                {events.length > 10 && (
                  <div className="text-center pt-4">
                    <Button variant="outline" className="text-gray-600">
                      <ChevronDown className="w-4 h-4 mr-2" />
                      Show {events.length - 10} more events
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
} 