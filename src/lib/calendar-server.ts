import { supabase } from './supabase'
import { calendar_v3 } from '@googleapis/calendar'
import { google } from 'googleapis'

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

export class CalendarServerService {
  /**
   * Create a Google Calendar client using stored tokens
   */
  static async createCalendarClient(userId: string): Promise<calendar_v3.Calendar | null> {
    try {
      console.log('Creating calendar client for user:', userId)
      
      // Get stored tokens from Supabase (simplified like the working test)
      const { data: tokens, error } = await supabase
        .from('gmail_tokens')
        .select('access_token, refresh_token, expires_at')
        .eq('user_id', userId)
        .single()

      if (error || !tokens || !tokens.access_token) {
        console.error('No valid tokens found for user:', userId, error)
        return null
      }

      console.log('Found tokens:', {
        hasAccessToken: !!tokens.access_token,
        hasRefreshToken: !!tokens.refresh_token,
        expiresAt: tokens.expires_at
      })

      // Only refresh if token is actually expired
      const isExpired = tokens.expires_at && new Date(tokens.expires_at) <= new Date()
      console.log('Token expired check:', { isExpired, expiresAt: tokens.expires_at, currentTime: new Date().toISOString() })
      
      let accessToken = tokens.access_token
      
      if (isExpired && tokens.refresh_token) {
        console.log('Token expired, refreshing...')
        const refreshed = await this.refreshAccessToken(userId, tokens.refresh_token)
        if (!refreshed) {
          console.error('Failed to refresh token')
          return null
        }
        console.log('Token refreshed successfully')
        
        // Get the refreshed token
        const { data: refreshedTokens } = await supabase
          .from('gmail_tokens')
          .select('access_token')
          .eq('user_id', userId)
          .single()
        
        if (refreshedTokens?.access_token) {
          accessToken = refreshedTokens.access_token
        }
      }

      console.log('Using access token:', accessToken.substring(0, 20) + '...')

      // Create Google Calendar client
      const auth = new google.auth.OAuth2()
      auth.setCredentials({
        access_token: accessToken
      })

      const calendar = google.calendar({ version: 'v3', auth })
      console.log('Calendar client created successfully')
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
   * Sync all confirmed subscriptions to calendar
   */
  static async syncAllSubscriptions(): Promise<{ success: number; failed: number }> {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return { success: 0, failed: 0 }

      const userId = session.user.id

      // Get all subscriptions without calendar events (including manual ones)
      const { data: subscriptions, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
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
   * Check if user has Google Calendar connected
   */
  static async isCalendarConnected(): Promise<boolean> {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return false

      // Check if we have valid calendar tokens
      const { data: tokens } = await supabase
        .from('gmail_tokens')
        .select('access_token, scope, expires_at')
        .eq('user_id', session.user.id)
        .single()

      if (!tokens || !tokens.access_token) return false

      // Check if the scope includes calendar access
      const hasCalendarScope = tokens.scope && 
        tokens.scope.includes('https://www.googleapis.com/auth/calendar')

      // Check if token is not expired (with 5 minute buffer)
      const isTokenValid = tokens.expires_at && 
        new Date(tokens.expires_at) > new Date(Date.now() + 5 * 60 * 1000)

      console.log('Calendar connection check:', {
        hasAccessToken: !!tokens.access_token,
        hasCalendarScope,
        isTokenValid,
        expiresAt: tokens.expires_at,
        currentTime: new Date().toISOString()
      })

      return hasCalendarScope && isTokenValid
    } catch (error) {
      console.error('Error checking calendar connection:', error)
      return false
    }
  }
} 