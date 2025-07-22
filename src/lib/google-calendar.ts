import { google } from 'googleapis'
import { supabase } from './supabase'

export interface GoogleCalendarEvent {
  id: string
  summary: string
  description: string
  start: {
    date: string // YYYY-MM-DD format for all-day events
    timeZone?: string
  }
  end: {
    date: string // YYYY-MM-DD format for all-day events
    timeZone?: string
  }
  reminders?: {
    useDefault: boolean
  }
}

export interface CalendarEventResponse {
  id: string
  summary: string
  start: { date: string }
  end: { date: string }
  description?: string
}

export class GoogleCalendarService {
  private static async getTokens(userId: string) {
    try {
      const { data: tokens, error } = await supabase
        .from('gmail_tokens')
        .select('access_token, refresh_token, expires_at')
        .eq('user_id', userId)
        .single()

      if (error || !tokens) {
        console.error('Error fetching tokens:', error)
        return null
      }

      return tokens
    } catch (error) {
      console.error('Error getting tokens:', error)
      return null
    }
  }

  private static async refreshTokensIfNeeded(tokens: any) {
    if (!tokens.expires_at || new Date(tokens.expires_at) <= new Date()) {
      console.log('Tokens expired, refreshing...')
      
      try {
        const oauth2Client = new google.auth.OAuth2(
          process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET,
          `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/auth/gmail/callback`
        )

        oauth2Client.setCredentials({
          refresh_token: tokens.refresh_token
        })

        const { credentials } = await oauth2Client.refreshAccessToken()
        
        // Update tokens in database
        const { error } = await supabase
          .from('gmail_tokens')
          .update({
            access_token: credentials.access_token,
            expires_at: credentials.expiry_date ? new Date(credentials.expiry_date).toISOString() : null,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', tokens.user_id)

        if (error) {
          console.error('Error updating refreshed tokens:', error)
          return null
        }

        return {
          ...tokens,
          access_token: credentials.access_token,
          expires_at: credentials.expiry_date ? new Date(credentials.expiry_date).toISOString() : null
        }
      } catch (error) {
        console.error('Error refreshing tokens:', error)
        return null
      }
    }

    return tokens
  }

  private static async createCalendarClient(userId: string) {
    try {
      const tokens = await this.getTokens(userId)
      if (!tokens) {
        throw new Error('No tokens found for user')
      }

      const refreshedTokens = await this.refreshTokensIfNeeded(tokens)
      if (!refreshedTokens) {
        throw new Error('Failed to refresh tokens')
      }

      const oauth2Client = new google.auth.OAuth2(
        process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/auth/gmail/callback`
      )

      oauth2Client.setCredentials({
        access_token: refreshedTokens.access_token,
        refresh_token: refreshedTokens.refresh_token
      })

      return google.calendar({ version: 'v3', auth: oauth2Client })
    } catch (error) {
      console.error('Error creating calendar client:', error)
      throw error
    }
  }

  /**
   * Create a dedicated calendar for the user
   */
  static async createUserCalendar(userId: string, userEmail: string): Promise<string | null> {
    try {
      const calendar = await this.createCalendarClient(userId)
      
      const calendarResource = {
        summary: `Sentinel Subscriptions - ${userEmail}`,
        description: 'Subscription renewals and trial end dates managed by Sentinel',
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }

      const response = await calendar.calendars.insert({
        requestBody: calendarResource
      })

      const calendarId = response.data.id
      console.log(`✅ Created calendar for user ${userId}: ${calendarId}`)

      // Store calendar ID in database
      const { error } = await supabase
        .from('user_calendars')
        .upsert({
          user_id: userId,
          calendar_id: calendarId,
          calendar_name: calendarResource.summary,
          created_at: new Date().toISOString()
        })

      if (error) {
        console.error('Error storing calendar ID:', error)
      }

      return calendarId
    } catch (error) {
      console.error('Error creating user calendar:', error)
      return null
    }
  }

  /**
   * Get or create user's dedicated calendar
   */
  static async getUserCalendar(userId: string, userEmail: string): Promise<string | null> {
    try {
      // Check if user already has a calendar
      const { data: existingCalendar } = await supabase
        .from('user_calendars')
        .select('calendar_id')
        .eq('user_id', userId)
        .single()

      if (existingCalendar?.calendar_id) {
        // Verify calendar still exists
        try {
          const calendar = await this.createCalendarClient(userId)
          await calendar.calendars.get({ calendarId: existingCalendar.calendar_id })
          return existingCalendar.calendar_id
        } catch (error) {
          console.log('Stored calendar not found, creating new one...')
          // Calendar was deleted, create new one
        }
      }

      // Create new calendar
      return await this.createUserCalendar(userId, userEmail)
    } catch (error) {
      console.error('Error getting user calendar:', error)
      return null
    }
  }

  /**
   * Create a calendar event for a subscription
   */
  static async createSubscriptionEvent(
    userId: string,
    subscriptionId: string,
    serviceName: string,
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
        throw new Error('No active session')
      }

      const userEmail = session.user.email
      if (!userEmail) {
        throw new Error('No user email found')
      }

      const calendarId = await this.getUserCalendar(userId, userEmail)
      if (!calendarId) {
        throw new Error('Failed to get user calendar')
      }

      const calendar = await this.createCalendarClient(userId)

      const title = eventType === 'renewal' 
        ? `Subscription Renewal: ${serviceName}`
        : `Trial Ends: ${serviceName}`

      let description = `${eventType === 'renewal' ? 'Your subscription will renew' : 'Your trial will end'} on ${eventDate}.`
      
      if (metadata?.amount) {
        description += `\n\nAmount: ${metadata.currency || 'USD'} ${metadata.amount}`
      }
      
      if (metadata?.originalEmailSubject) {
        description += `\n\nSource: ${metadata.originalEmailSubject}`
      }
      
      if (metadata?.cancelUrl) {
        description += `\n\nCancel: ${metadata.cancelUrl}`
      }

      const event: GoogleCalendarEvent = {
        summary: title,
        description: description,
        start: {
          date: eventDate, // All-day event
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        end: {
          date: eventDate, // All-day event
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        reminders: {
          useDefault: false // No reminders, handled by app
        }
      }

      const response = await calendar.events.insert({
        calendarId: calendarId,
        requestBody: event
      })

      const eventId = response.data.id
      console.log(`✅ Created calendar event: ${eventId} for subscription ${subscriptionId}`)

      // Store event ID in database
      const { error } = await supabase
        .from('subscriptions')
        .update({
          calendar_event_id: eventId,
          calendar_id: calendarId,
          updated_at: new Date().toISOString()
        })
        .eq('id', subscriptionId)

      if (error) {
        console.error('Error storing event ID:', error)
      }

      return eventId
    } catch (error) {
      console.error('Error creating subscription event:', error)
      return null
    }
  }

  /**
   * Update a calendar event
   */
  static async updateSubscriptionEvent(
    userId: string,
    subscriptionId: string,
    eventId: string,
    serviceName: string,
    eventDate: string,
    eventType: 'renewal' | 'trial_end',
    metadata?: {
      originalEmailSubject?: string
      cancelUrl?: string
      amount?: number
      currency?: string
    }
  ): Promise<boolean> {
    try {
      const calendar = await this.createCalendarClient(userId)

      const title = eventType === 'renewal' 
        ? `Subscription Renewal: ${serviceName}`
        : `Trial Ends: ${serviceName}`

      let description = `${eventType === 'renewal' ? 'Your subscription will renew' : 'Your trial will end'} on ${eventDate}.`
      
      if (metadata?.amount) {
        description += `\n\nAmount: ${metadata.currency || 'USD'} ${metadata.amount}`
      }
      
      if (metadata?.originalEmailSubject) {
        description += `\n\nSource: ${metadata.originalEmailSubject}`
      }
      
      if (metadata?.cancelUrl) {
        description += `\n\nCancel: ${metadata.cancelUrl}`
      }

      const event: Partial<GoogleCalendarEvent> = {
        summary: title,
        description: description,
        start: {
          date: eventDate,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        end: {
          date: eventDate,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        }
      }

      await calendar.events.update({
        calendarId: 'primary', // Will be updated to user's calendar
        eventId: eventId,
        requestBody: event
      })

      console.log(`✅ Updated calendar event: ${eventId} for subscription ${subscriptionId}`)
      return true
    } catch (error) {
      console.error('Error updating subscription event:', error)
      return false
    }
  }

  /**
   * Delete a calendar event
   */
  static async deleteSubscriptionEvent(
    userId: string,
    eventId: string,
    subscriptionId: string
  ): Promise<boolean> {
    try {
      const calendar = await this.createCalendarClient(userId)

      await calendar.events.delete({
        calendarId: 'primary', // Will be updated to user's calendar
        eventId: eventId
      })

      console.log(`✅ Deleted calendar event: ${eventId} for subscription ${subscriptionId}`)

      // Remove event ID from database
      const { error } = await supabase
        .from('subscriptions')
        .update({
          calendar_event_id: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', subscriptionId)

      if (error) {
        console.error('Error removing event ID from database:', error)
      }

      return true
    } catch (error) {
      console.error('Error deleting subscription event:', error)
      return false
    }
  }

  /**
   * Sync all confirmed subscriptions to calendar
   */
  static async syncAllSubscriptions(userId: string): Promise<{ success: number; failed: number }> {
    try {
      const { data: subscriptions, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .is('calendar_event_id', null) // Only sync subscriptions without calendar events

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
              userId,
              subscription.id,
              subscription.service,
              subscription.renewal_date,
              'renewal',
              {
                originalEmailSubject: subscription.source_email_subject,
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
              userId,
              subscription.id,
              subscription.service,
              subscription.trial_end_date,
              'trial_end',
              {
                originalEmailSubject: subscription.source_email_subject,
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
   * Check if user has calendar access
   */
  static async isCalendarConnected(userId: string): Promise<boolean> {
    try {
      const tokens = await this.getTokens(userId)
      if (!tokens) return false

      // Check if tokens have calendar scope
      const hasCalendarScope = tokens.scope && 
        tokens.scope.includes('https://www.googleapis.com/auth/calendar')

      if (!hasCalendarScope) return false

      // Test calendar access
      const calendar = await this.createCalendarClient(userId)
      await calendar.calendarList.list()
      
      return true
    } catch (error) {
      console.error('Error checking calendar connection:', error)
      return false
    }
  }
} 