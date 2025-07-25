import { calendar_v3 } from '@googleapis/calendar'
import { google } from 'googleapis'
import { SupabaseClient } from '@supabase/supabase-js'

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

export class CalendarServerServiceFixed {
  /**
   * Create a Google Calendar client using stored tokens (simplified version)
   */
  static async createCalendarClient(userId: string, supabase: SupabaseClient): Promise<calendar_v3.Calendar | null> {
    try {
      console.log('=== CREATE CALENDAR CLIENT START ===')
      console.log('Creating calendar client for user:', userId)
      
      // Step 1: Get stored tokens from Supabase
      console.log('Step 1: Fetching tokens from database...')
      const { data: tokens, error } = await supabase
        .from('gmail_tokens')
        .select('access_token, refresh_token, expires_at, scope')
        .eq('user_id', userId)
        .single()

      console.log('Database query result:', {
        hasData: !!tokens,
        hasError: !!error,
        errorMessage: error?.message
      })

      if (error || !tokens || !tokens.access_token) {
        console.error('❌ No valid tokens found:', error?.message || 'No tokens')
        return null
      }

      console.log('✅ Tokens found successfully:', {
        hasAccessToken: !!tokens.access_token,
        accessTokenLength: tokens.access_token?.length || 0,
        scope: tokens.scope
      })

      // Step 2: Check if token is expired
      const isExpired = tokens.expires_at && new Date(tokens.expires_at) <= new Date()
      console.log('Token expiration check:', { 
        isExpired, 
        expiresAt: tokens.expires_at, 
        currentTime: new Date().toISOString()
      })

      if (isExpired) {
        console.log('❌ Token is expired, cannot proceed')
        return null
      }

      // Step 3: Create Google Calendar client (simplified like working test)
      console.log('Step 3: Creating Google Calendar client...')
      try {
        const auth = new google.auth.OAuth2()
        console.log('✅ OAuth2 client created')
        
        auth.setCredentials({
          access_token: tokens.access_token
        })
        console.log('✅ Credentials set')

        const calendar = google.calendar({ version: 'v3', auth })
        console.log('✅ Calendar client created')
        
        console.log('=== CREATE CALENDAR CLIENT SUCCESS ===')
        return calendar
      } catch (clientError) {
        console.error('❌ Error creating calendar client:', clientError)
        return null
      }
    } catch (error) {
      console.error('=== CREATE CALENDAR CLIENT FAILED ===')
      console.error('❌ Top-level error creating calendar client:', error)
      return null
    }
  }

  /**
   * Get or create user's dedicated calendar
   */
  static async getUserCalendar(userId: string, supabase: SupabaseClient): Promise<string | null> {
    try {
      console.log(`Getting calendar for user: ${userId}`)
      
      // First, try to find existing calendar in database
      const { data: existingCalendar, error: dbError } = await supabase
        .from('user_calendars')
        .select('calendar_id, calendar_name')
        .eq('user_id', userId)
        .single()

      if (dbError && dbError.code !== 'PGRST116') {
        console.error('Database error checking for existing calendar:', dbError)
      }

      if (existingCalendar?.calendar_id) {
        console.log(`✅ Found existing calendar in database: ${existingCalendar.calendar_id}`)
        return existingCalendar.calendar_id
      }

      console.log('No existing calendar found, creating new one...')

      // Create calendar client
      const calendar = await this.createCalendarClient(userId, supabase)
      if (!calendar) {
        console.error('Failed to create calendar client for new calendar')
        return null
      }

      // Create new dedicated calendar
      const calendarName = `Sentinel Subscriptions - ${new Date().getFullYear()}`
      const calendarResource = {
        summary: calendarName,
        description: 'Subscription renewals and trial end dates managed by Sentinel',
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }

      console.log('Creating new Google Calendar...')
      const response = await calendar.calendars.insert({
        requestBody: calendarResource
      })

      if (!response.data.id) {
        console.error('Failed to create calendar - no ID returned')
        return null
      }

      const calendarId = response.data.id
      console.log(`✅ Created new Google Calendar: ${calendarId}`)

      // Store calendar ID in database with error handling
      console.log('Storing calendar ID in database...')
      const { error: insertError } = await supabase
        .from('user_calendars')
        .insert({
          user_id: userId,
          calendar_id: calendarId,
          calendar_name: calendarName,
          created_at: new Date().toISOString()
        })

      if (insertError) {
        console.error('Error storing calendar ID in database:', insertError)
        console.log('Calendar was created in Google but not stored in database')
        // Still return the calendar ID even if storage fails
        return calendarId
      }

      console.log(`✅ Successfully stored calendar ID in database`)
      return calendarId
    } catch (error) {
      console.error('Error getting user calendar:', error)
      return null
    }
  }

  /**
   * Create a calendar event for a subscription (with pre-existing calendar client)
   */
  static async createSubscriptionEventWithCalendar(
    subscriptionId: string,
    subscriptionName: string,
    eventDate: string,
    eventType: 'renewal' | 'trial_end',
    calendarId: string,
    calendar: calendar_v3.Calendar,
    supabase: SupabaseClient,
    metadata?: {
      originalEmailSubject?: string
      cancelUrl?: string
      amount?: number
      currency?: string
    }
  ): Promise<string | null> {
    try {
      console.log(`Creating event for subscription: ${subscriptionName} (${subscriptionId})`)

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

      console.log('Creating calendar event:', { title, eventDate, calendarId })
      const response = await calendar.events.insert({
        calendarId: calendarId,
        requestBody: event
      })

      if (!response.data.id) {
        console.error('Failed to create calendar event')
        return null
      }

      const eventId = response.data.id
      console.log(`✅ Created calendar event: ${eventId}`)

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

      console.log(`✅ Updated subscription with calendar event ID`)
      return eventId
    } catch (error) {
      console.error('Error creating subscription calendar event:', error)
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
    supabase: SupabaseClient,
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
      console.log(`Creating event for subscription: ${subscriptionName} (${subscriptionId})`)

      // Get user's dedicated calendar
      const calendarId = await this.getUserCalendar(userId, supabase)
      if (!calendarId) {
        console.error('Failed to get user calendar')
        return null
      }

      // Create calendar client
      const calendar = await this.createCalendarClient(userId, supabase)
      if (!calendar) {
        console.error('Failed to create calendar client')
        return null
      }

      // Use the optimized method
      return await this.createSubscriptionEventWithCalendar(
        subscriptionId,
        subscriptionName,
        eventDate,
        eventType,
        calendarId,
        calendar,
        supabase,
        metadata
      )
    } catch (error) {
      console.error('Error creating subscription calendar event:', error)
      return null
    }
  }

  /**
   * Sync all confirmed subscriptions to calendar
   */
  static async syncAllSubscriptions(supabase: SupabaseClient): Promise<{ success: number; failed: number }> {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return { success: 0, failed: 0 }

      const userId = session.user.id
      console.log(`Syncing subscriptions for user: ${userId}`)

      // Get user's calendar ID once (reuse for all subscriptions)
      console.log('Getting user calendar ID...')
      const calendarId = await this.getUserCalendar(userId, supabase)
      if (!calendarId) {
        console.error('Failed to get user calendar')
        return { success: 0, failed: 0 }
      }
      console.log(`✅ Using calendar: ${calendarId}`)

      // Create calendar client once (reuse for all subscriptions)
      console.log('Creating calendar client...')
      const calendar = await this.createCalendarClient(userId, supabase)
      if (!calendar) {
        console.error('Failed to create calendar client')
        return { success: 0, failed: 0 }
      }
      console.log('✅ Calendar client ready')

      // Get all subscriptions without calendar events
      const { data: subscriptions, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .is('calendar_event_id', null)

      if (error) {
        console.error('Error fetching subscriptions for sync:', error)
        return { success: 0, failed: 0 }
      }

      console.log(`Found ${subscriptions?.length || 0} subscriptions to sync`)

      let success = 0
      let failed = 0

      for (const subscription of subscriptions || []) {
        try {
          // Create renewal event if renewal_date exists
          if (subscription.renewal_date) {
            const eventId = await this.createSubscriptionEventWithCalendar(
              subscription.id,
              subscription.name,
              subscription.renewal_date,
              'renewal',
              calendarId,
              calendar,
              supabase,
              {
                originalEmailSubject: subscription.source_email_id,
                cancelUrl: subscription.cancel_url,
                amount: subscription.amount,
                currency: subscription.currency
              }
            )
            if (eventId) {
              success++
              console.log(`✅ Synced renewal event for ${subscription.name}`)
            } else {
              failed++
              console.log(`❌ Failed to sync renewal event for ${subscription.name}`)
            }
          }

          // Create trial end event if trial_end_date exists
          if (subscription.trial_end_date) {
            const eventId = await this.createSubscriptionEventWithCalendar(
              subscription.id,
              subscription.name,
              subscription.trial_end_date,
              'trial_end',
              calendarId,
              calendar,
              supabase,
              {
                originalEmailSubject: subscription.source_email_id,
                cancelUrl: subscription.cancel_url,
                amount: subscription.amount,
                currency: subscription.currency
              }
            )
            if (eventId) {
              success++
              console.log(`✅ Synced trial end event for ${subscription.name}`)
            } else {
              failed++
              console.log(`❌ Failed to sync trial end event for ${subscription.name}`)
            }
          }
        } catch (error) {
          console.error(`Error syncing subscription ${subscription.id}:`, error)
          failed++
        }
      }

      console.log(`✅ Sync completed: ${success} successful, ${failed} failed`)
      return { success, failed }
    } catch (error) {
      console.error('Error syncing all subscriptions:', error)
      return { success: 0, failed: 0 }
    }
  }

  /**
   * Check if user has Google Calendar connected
   */
  static async isCalendarConnected(supabase: SupabaseClient): Promise<boolean> {
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

      // Check if token is not expired
      const isTokenValid = tokens.expires_at && 
        new Date(tokens.expires_at) > new Date()

      console.log('Calendar connection check:', {
        hasAccessToken: !!tokens.access_token,
        hasCalendarScope,
        isTokenValid,
        expiresAt: tokens.expires_at
      })

      return hasCalendarScope && isTokenValid
    } catch (error) {
      console.error('Error checking calendar connection:', error)
      return false
    }
  }
} 