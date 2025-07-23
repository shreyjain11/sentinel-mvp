import { supabase } from './supabase'

// Only import Google APIs on server side
let calendar_v3: any
let google: any

if (typeof window === 'undefined') {
  // Server-side only imports
  const googleapis = require('@googleapis/calendar')
  calendar_v3 = googleapis.calendar_v3
  google = require('googleapis').google
}

export interface CalendarEvent {
  id: string
  title: string
  description: string
  start: string
  end: string
  type: 'renewal' | 'trial_end'
  subscriptionId: string
  calendarEventId?: string
  calendarId?: string
}

export interface GoogleCalendarEvent {
  id: string
  summary: string
  description: string
  start: {
    date: string
    timeZone: string
  }
  end: {
    date: string
    timeZone: string
  }
}

export class CalendarService {
  /**
   * Create a Google Calendar client using stored tokens
   */
  static async createCalendarClient(userId: string): Promise<any | null> {
    // Server-side only
    if (typeof window !== 'undefined') {
      console.error('Calendar operations must be performed server-side')
      return null
    }

    try {
      // Get stored tokens from Supabase
      const { data: tokens, error } = await supabase
        .from('gmail_tokens')
        .select('access_token, refresh_token, expires_at')
        .eq('user_id', userId)
        .single()

      if (error || !tokens) {
        console.error('No tokens found for user:', userId)
        return null
      }

      // Check if token is expired and refresh if needed
      const isExpired = tokens.expires_at && new Date(tokens.expires_at) <= new Date()
      
      if (isExpired && tokens.refresh_token) {
        console.log('Token expired, refreshing...')
        const refreshed = await this.refreshAccessToken(userId, tokens.refresh_token)
        if (!refreshed) {
          console.error('Failed to refresh token')
          return null
        }
      }

      // Get the latest tokens after potential refresh
      const { data: latestTokens } = await supabase
        .from('gmail_tokens')
        .select('access_token')
        .eq('user_id', userId)
        .single()

      if (!latestTokens?.access_token) {
        console.error('No valid access token found')
        return null
      }

      // Create Google Calendar client
      const auth = new google.auth.OAuth2()
      auth.setCredentials({
        access_token: latestTokens.access_token
      })

      const calendar = google.calendar({ version: 'v3', auth })
      return calendar
    } catch (error) {
      console.error('Error creating calendar client:', error)
      return null
    }
  }

  /**
   * Refresh access token using refresh token
   */
  static async refreshAccessToken(userId: string, refreshToken: string): Promise<boolean> {
    // Server-side only
    if (typeof window !== 'undefined') {
      return false
    }

    try {
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET

      if (!clientId || !clientSecret) {
        console.error('Missing Google OAuth credentials')
        return false
      }

      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
      })

      if (!response.ok) {
        console.error('Failed to refresh token:', response.status)
        return false
      }

      const data = await response.json()
      
      // Update tokens in Supabase
      const { error } = await supabase
        .from('gmail_tokens')
        .update({
          access_token: data.access_token,
          expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)

      if (error) {
        console.error('Error updating refreshed tokens:', error)
        return false
      }

      console.log('✅ Access token refreshed successfully')
      return true
    } catch (error) {
      console.error('Error refreshing access token:', error)
      return false
    }
  }

  /**
   * Get or create user's dedicated calendar
   */
  static async getUserCalendar(userId: string): Promise<string | null> {
    // Server-side only
    if (typeof window !== 'undefined') {
      return null
    }

    try {
      const calendar = await this.createCalendarClient(userId)
      if (!calendar) return null

      // Check if user already has a dedicated calendar
      const { data: existingCalendar } = await supabase
        .from('user_calendars')
        .select('calendar_id')
        .eq('user_id', userId)
        .single()

      if (existingCalendar?.calendar_id) {
        return existingCalendar.calendar_id
      }

      // Create new dedicated calendar
      const calendarName = `Sentinel Subscriptions - ${new Date().getFullYear()}`
      const calendarResource = {
        summary: calendarName,
        description: 'Subscription renewals and trial end dates managed by Sentinel',
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }

      const response = await calendar.calendars.insert({
        requestBody: calendarResource
      })

      if (!response.data.id) {
        console.error('Failed to create calendar')
        return null
      }

      const calendarId = response.data.id

      // Store calendar ID in database
      const { error } = await supabase
        .from('user_calendars')
        .insert({
          user_id: userId,
          calendar_id: calendarId,
          calendar_name: calendarName,
          created_at: new Date().toISOString()
        })

      if (error) {
        console.error('Error storing calendar ID:', error)
        // Still return the calendar ID even if storage fails
        return calendarId
      }

      console.log(`✅ Created dedicated calendar: ${calendarId}`)
      return calendarId
    } catch (error) {
      console.error('Error getting user calendar:', error)
      return null
    }
  }

  /**
   * Create a calendar event for a subscription
   */
  static async createSubscriptionEvent(
    subscriptionId: string,
    subscriptionName: string,
    eventDate: string,
    eventType: 'renewal' | 'trial_end',
    metadata?: {
      originalEmailSubject?: string
      cancelUrl?: string
      amount?: number
      currency?: string
    }
  ): Promise<string | null> {
    // Server-side only
    if (typeof window !== 'undefined') {
      console.error('Calendar operations must be performed server-side')
      return null
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        console.error('No active session')
        return null
      }

      const userId = session.user.id

      // Get user's dedicated calendar
      const calendarId = await this.getUserCalendar(userId)
      if (!calendarId) {
        console.error('Failed to get user calendar')
        return null
      }

      // Create calendar client
      const calendar = await this.createCalendarClient(userId)
      if (!calendar) {
        console.error('Failed to create calendar client')
        return null
      }

      // Prepare event details
      const title = eventType === 'renewal' 
        ? `Subscription Renewal: ${subscriptionName}`
        : `Trial Ends: ${subscriptionName}`

      let description = eventType === 'renewal'
        ? `Your ${subscriptionName} subscription will renew automatically.`
        : `Your ${subscriptionName} trial will end.`

      if (metadata?.amount) {
        description += `\n\nAmount: ${metadata.currency || 'USD'} ${metadata.amount}`
      }

      if (metadata?.originalEmailSubject) {
        description += `\n\nSource: ${metadata.originalEmailSubject}`
      }

      if (metadata?.cancelUrl) {
        description += `\n\nCancel: ${metadata.cancelUrl}`
      }

      // Create calendar event
      const event = {
        summary: title,
        description: description,
        start: {
          date: eventDate,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        end: {
          date: eventDate,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        reminders: {
          useDefault: false,
          overrides: [] // No reminders as per requirements
        }
      }

      const response = await calendar.events.insert({
        calendarId: calendarId,
        requestBody: event
      })

      if (!response.data.id) {
        console.error('Failed to create calendar event')
        return null
      }

      const eventId = response.data.id

      // Store event ID in subscription record
      const { error } = await supabase
        .from('subscriptions')
        .update({
          calendar_event_id: eventId,
          calendar_id: calendarId,
          updated_at: new Date().toISOString()
        })
        .eq('id', subscriptionId)

      if (error) {
        console.error('Error storing calendar event ID:', error)
        // Still return the event ID even if storage fails
        return eventId
      }

      console.log(`✅ Created calendar event: ${eventId} for subscription: ${subscriptionId}`)
      return eventId
    } catch (error) {
      console.error('Error creating subscription calendar event:', error)
      return null
    }
  }

  /**
   * Update a calendar event
   */
  static async updateSubscriptionEvent(
    subscriptionId: string,
    eventId: string,
    updates: {
      title?: string
      description?: string
      date?: string
    }
  ): Promise<boolean> {
    // Server-side only
    if (typeof window !== 'undefined') {
      return false
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return false

      const userId = session.user.id
      const calendar = await this.createCalendarClient(userId)
      if (!calendar) return false

      // Get user's calendar ID
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('calendar_id')
        .eq('id', subscriptionId)
        .single()

      if (!subscription?.calendar_id) {
        console.error('No calendar ID found for subscription')
        return false
      }

      // Prepare event updates
      const eventUpdate: any = {}
      
      if (updates.title) eventUpdate.summary = updates.title
      if (updates.description) eventUpdate.description = updates.description
      if (updates.date) {
        eventUpdate.start = {
          date: updates.date,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        }
        eventUpdate.end = {
          date: updates.date,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        }
      }

      const response = await calendar.events.update({
        calendarId: subscription.calendar_id,
        eventId: eventId,
        requestBody: eventUpdate
      })

      if (!response.data.id) {
        console.error('Failed to update calendar event')
        return false
      }

      console.log(`✅ Updated calendar event: ${eventId}`)
      return true
    } catch (error) {
      console.error('Error updating calendar event:', error)
      return false
    }
  }

  /**
   * Delete a calendar event
   */
  static async deleteSubscriptionEvent(subscriptionId: string): Promise<boolean> {
    // Server-side only
    if (typeof window !== 'undefined') {
      return false
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return false

      // Get event details from subscription
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('calendar_event_id, calendar_id')
        .eq('id', subscriptionId)
        .single()

      if (!subscription?.calendar_event_id || !subscription?.calendar_id) {
        console.log('No calendar event found for subscription')
        return true // Consider it successful if no event exists
      }

      const userId = session.user.id
      const calendar = await this.createCalendarClient(userId)
      if (!calendar) return false

      // Delete the event
      await calendar.events.delete({
        calendarId: subscription.calendar_id,
        eventId: subscription.calendar_event_id
      })

      // Remove event ID from subscription
      await supabase
        .from('subscriptions')
        .update({
          calendar_event_id: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', subscriptionId)

      console.log(`✅ Deleted calendar event: ${subscription.calendar_event_id}`)
      return true
    } catch (error) {
      console.error('Error deleting calendar event:', error)
      return false
    }
  }

  /**
   * Sync all confirmed subscriptions to calendar
   */
  static async syncAllSubscriptions(): Promise<{ success: number; failed: number }> {
    // Server-side only
    if (typeof window !== 'undefined') {
      return { success: 0, failed: 0 }
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return { success: 0, failed: 0 }

      const userId = session.user.id

      // Get all confirmed subscriptions without calendar events
      const { data: subscriptions, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .is('calendar_event_id', null)

      if (error) {
        console.error('Error fetching subscriptions for sync:', error)
        return { success: 0, failed: 0 }
      }

      let success = 0
      let failed = 0

      for (const subscription of subscriptions || []) {
        try {
          // Create renewal event if renewal_date exists
          if (subscription.renewal_date) {
            const eventId = await this.createSubscriptionEvent(
              subscription.id,
              subscription.name,
              subscription.renewal_date,
              'renewal',
              {
                originalEmailSubject: subscription.source_email_id,
                cancelUrl: subscription.cancel_url,
                amount: subscription.amount,
                currency: subscription.currency
              }
            )
            if (eventId) success++
            else failed++
          }

          // Create trial end event if trial_end_date exists
          if (subscription.trial_end_date) {
            const eventId = await this.createSubscriptionEvent(
              subscription.id,
              subscription.name,
              subscription.trial_end_date,
              'trial_end',
              {
                originalEmailSubject: subscription.source_email_id,
                cancelUrl: subscription.cancel_url,
                amount: subscription.amount,
                currency: subscription.currency
              }
            )
            if (eventId) success++
            else failed++
          }
        } catch (error) {
          console.error(`Error syncing subscription ${subscription.id}:`, error)
          failed++
        }
      }

      console.log(`✅ Synced ${success} events to Google Calendar (${failed} failed)`)
      return { success, failed }
    } catch (error) {
      console.error('Error syncing all subscriptions:', error)
      return { success: 0, failed: 0 }
    }
  }

  /**
   * Check if user has connected their Google Calendar
   */
  static async isCalendarConnected(): Promise<boolean> {
    try {
      const response = await fetch('/api/calendar/status')
      if (response.ok) {
        const data = await response.json()
        return data.connected
      }
      return false
    } catch (error) {
      console.error('Error checking calendar connection:', error)
      return false
    }
  }

  /**
   * Get upcoming events from user's subscriptions
   */
  static async getUpcomingEvents(): Promise<CalendarEvent[]> {
    try {
      const response = await fetch('/api/calendar/events')
      if (response.ok) {
        const data = await response.json()
        return data.events || []
      }
      return []
    } catch (error) {
      console.error('Error loading events:', error)
      return []
    }
  }

  /**
   * Connect Google Calendar (OAuth flow)
   */
  static async connectCalendar(): Promise<void> {
    try {
      // Redirect to Google OAuth for calendar
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
      const redirectUri = `${window.location.origin}/auth/calendar/callback`
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
      console.error('Error connecting calendar:', error)
      throw error
    }
  }
} 