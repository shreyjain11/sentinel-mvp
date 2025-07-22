'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, ArrowLeft, Calendar as CalendarIcon, RefreshCw, CheckCircle, Clock, AlertTriangle, RefreshCcw, CreditCard, Bell } from "lucide-react"
import Link from "next/link"
import { CalendarService, CalendarEvent } from '@/lib/calendar'
import { formatCurrency } from '@/lib/utils'

export default function CalendarPage() {
  const [calendarConnected, setCalendarConnected] = useState(false)
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)

  useEffect(() => {
    checkCalendarStatus()
    loadEvents()
  }, [])

  // Check for URL parameters that indicate successful OAuth
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('connected') === 'true') {
      // Remove the parameter from URL
      window.history.replaceState({}, '', window.location.pathname)
      // Refresh the calendar status
      checkCalendarStatus()
    }
  }, [])

  const checkCalendarStatus = async () => {
    try {
      const connected = await CalendarService.isCalendarConnected()
      console.log('Calendar connection status:', connected)
      setCalendarConnected(connected)
      // Reload events when status changes
      if (connected) {
        await loadEvents()
      }
    } catch (error) {
      console.error('Error checking calendar status:', error)
    } finally {
      setLoading(false)
    }
  }

  const refreshStatus = async () => {
    setLoading(true)
    await checkCalendarStatus()
    await loadEvents()
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
        headers: {
          'Content-Type': 'application/json',
        },
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
      
      // Show success message
      alert(`Successfully synced ${result.result.success} events to Google Calendar!`)
    } catch (error) {
      console.error('Error syncing to calendar:', error)
      setSyncError('Failed to sync calendar. Please try again.')
    } finally {
      setSyncing(false)
    }
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

  const getEventIcon = (type: 'renewal' | 'trial_end') => {
    return type === 'renewal' ? <CreditCard className="w-4 h-4" /> : <Clock className="w-4 h-4" />
  }

  const getEventColor = (type: 'renewal' | 'trial_end') => {
    return type === 'renewal' 
      ? 'bg-red-100 text-red-800 border-red-200' 
      : 'bg-orange-100 text-orange-800 border-orange-200'
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
        <Card className={`mb-8 ${calendarConnected ? 'border-green-200 bg-green-50/50' : 'border-yellow-200 bg-yellow-50/50'}`}>
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
                        <RefreshCcw className="w-4 h-4 mr-2" />
                        Sync to Calendar
                      </>
                    )}
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

        {/* Error Message */}
        {syncError && (
          <Card className="mb-8 border-red-200 bg-red-50">
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
                  Dismiss
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Upcoming Events */}
          <Card className="trust-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="w-5 h-5" />
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
                <div className="text-center py-8">
                  <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No upcoming events</h3>
                  <p className="text-gray-600">
                    Your subscription events will appear here when you have active subscriptions with renewal or trial end dates.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {events.slice(0, 10).map((event) => {
                    const daysUntil = getDaysUntil(event.start)
                    const isUrgent = daysUntil <= 3
                    
                    return (
                      <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <div className="text-gray-600">
                              {getEventIcon(event.type)}
                            </div>
                            <h3 className="font-medium">{event.title}</h3>
                            <Badge className={getEventColor(event.type)}>
                              {event.type === 'renewal' ? 'Renewal' : 'Trial End'}
                            </Badge>
                            {isUrgent && (
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
                          <p className="text-sm text-gray-600 mb-1">
                            {formatDate(event.start)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {daysUntil === 0 ? 'Today' : 
                             daysUntil === 1 ? 'Tomorrow' : 
                             daysUntil > 0 ? `In ${daysUntil} days` : 
                             `${Math.abs(daysUntil)} days ago`}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                  {events.length > 10 && (
                    <p className="text-sm text-gray-500 text-center mt-4">
                      And {events.length - 10} more events...
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Calendar Actions */}
          <Card className="trust-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CalendarIcon className="w-5 h-5" />
                <span>Calendar Actions</span>
              </CardTitle>
              <CardDescription>
                Manage your calendar integration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center space-x-3 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <h3 className="font-medium">Automatic Sync</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    When you connect Google Calendar, new subscriptions will automatically create calendar events for renewals and trial endings.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="flex items-center space-x-1">
                      <CreditCard className="w-3 h-3" />
                      <span>Renewal Reminders</span>
                    </Badge>
                    <Badge variant="outline" className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>Trial End Alerts</span>
                    </Badge>
                    <Badge variant="outline" className="flex items-center space-x-1">
                      <Bell className="w-3 h-3" />
                      <span>1-Day Notifications</span>
                    </Badge>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center space-x-3 mb-2">
                    <RefreshCw className="w-5 h-5 text-blue-600" />
                    <h3 className="font-medium">Manual Sync</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Sync all your existing subscriptions to Google Calendar at once.
                  </p>
                  <Button 
                    onClick={syncToCalendar} 
                    disabled={!calendarConnected || syncing}
                    variant="outline"
                    className="w-full"
                  >
                    {syncing ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Syncing...
                      </>
                    ) : (
                      <>
                        <RefreshCcw className="w-4 h-4 mr-2" />
                        Sync All Events
                      </>
                    )}
                  </Button>
                </div>

                {!calendarConnected && (
                  <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
                    <div className="flex items-center space-x-3 mb-2">
                      <AlertTriangle className="w-5 h-5 text-yellow-600" />
                      <h3 className="font-medium text-yellow-900">Calendar Not Connected</h3>
                    </div>
                    <p className="text-sm text-yellow-700 mb-3">
                      Connect your Google Calendar to enable automatic event creation and reminders.
                    </p>
                    <Button onClick={connectCalendar} disabled={loading} className="w-full">
                      <CalendarIcon className="w-4 h-4 mr-2" />
                      Connect Google Calendar
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
} 