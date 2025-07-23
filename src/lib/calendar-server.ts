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
      console.log('=== CREATE CALENDAR CLIENT START ===')
      console.log('Creating calendar client for user:', userId)
      
      // Step 1: Get stored tokens from Supabase
      console.log('Step 1: Fetching tokens from database...')
      const { data: tokens, error } = await supabase
        .from('gmail_tokens')
        .select('access_token, refresh_token, expires_at')
        .eq('user_id', userId)
        .single()

      console.log('Database query result:', {
        hasData: !!tokens,
        hasError: !!error,
        errorMessage: error?.message,
        errorCode: error?.code,
        errorDetails: error?.details
      })

      if (error) {
        console.error('❌ Database error:', error)
        return null
      }

      if (!tokens) {
        console.error('❌ No tokens found in database')
        return null
      }

      if (!tokens.access_token) {
        console.error('❌ No access token found in tokens')
        return null
      }

      console.log('✅ Tokens found successfully:', {
        hasAccessToken: !!tokens.access_token,
        accessTokenLength: tokens.access_token?.length || 0,
        hasRefreshToken: !!tokens.refresh_token,
        refreshTokenLength: tokens.refresh_token?.length || 0,
        expiresAt: tokens.expires_at
      })

      // Step 2: Check token expiration
      console.log('Step 2: Checking token expiration...')
      const isExpired = tokens.expires_at && new Date(tokens.expires_at) <= new Date()
      console.log('Token expiration check:', { 
        isExpired, 
        expiresAt: tokens.expires_at, 
        currentTime: new Date().toISOString(),
        timeUntilExpiry: tokens.expires_at ? new Date(tokens.expires_at).getTime() - new Date().getTime() : 'N/A'
      })
      
      let accessToken = tokens.access_token
      
      // Step 3: Refresh token if needed
      if (isExpired && tokens.refresh_token) {
        console.log('Step 3: Token expired, attempting refresh...')
        const refreshed = await this.refreshAccessToken(userId, tokens.refresh_token)
        if (!refreshed) {
          console.error('❌ Failed to refresh token')
          return null
        }
        console.log('✅ Token refreshed successfully')
        
        // Get the refreshed token
        console.log('Step 3a: Fetching refreshed token...')
        const { data: refreshedTokens, error: refreshError } = await supabase
          .from('gmail_tokens')
          .select('access_token')
          .eq('user_id', userId)
          .single()
        
        console.log('Refreshed token fetch result:', {
          hasData: !!refreshedTokens,
          hasError: !!refreshError,
          errorMessage: refreshError?.message
        })
        
        if (refreshedTokens?.access_token) {
          accessToken = refreshedTokens.access_token
          console.log('✅ Using refreshed access token')
        } else {
          console.log('⚠️ No refreshed token found, using original')
        }
      } else {
        console.log('Step 3: Token not expired, skipping refresh')
      }

      console.log('Final access token info:', {
        tokenLength: accessToken.length,
        tokenPrefix: accessToken.substring(0, 20) + '...',
        tokenSuffix: '...' + accessToken.substring(accessToken.length - 10)
      })

      // Step 4: Create Google Calendar client
      console.log('Step 4: Creating Google Calendar client...')
      try {
        const auth = new google.auth.OAuth2()
        console.log('✅ OAuth2 client created')
        
        auth.setCredentials({
          access_token: accessToken
        })
        console.log('✅ Credentials set')

        const calendar = google.calendar({ version: 'v3', auth })
        console.log('✅ Calendar client created')
        
        console.log('=== CREATE CALENDAR CLIENT SUCCESS ===')
        return calendar
      } catch (clientError) {
        console.error('❌ Error creating calendar client:', clientError)
        console.error('Client error details:', {
          name: clientError instanceof Error ? clientError.name : 'Unknown',
          message: clientError instanceof Error ? clientError.message : 'Unknown',
          stack: clientError instanceof Error ? clientError.stack : 'No stack'
        })
        return null
      }
    } catch (error) {
      console.error('=== CREATE CALENDAR CLIENT FAILED ===')
      console.error('❌ Top-level error creating calendar client:', error)
      console.error('Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : 'Unknown',
        stack: error instanceof Error ? error.stack : 'No stack'
      })
      return null
    }
  }

  /**
   * Refresh access token using refresh token
   */
  static async refreshAccessToken(userId: string, refreshToken: string): Promise<boolean> {
    try {
      console.log('=== REFRESH ACCESS TOKEN START ===')
      console.log('Refreshing token for user:', userId)
      
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET

      console.log('Environment variables check:', {
        hasClientId: !!clientId,
        clientIdLength: clientId?.length || 0,
        hasClientSecret: !!clientSecret,
        clientSecretLength: clientSecret?.length || 0
      })

      if (!clientId || !clientSecret) {
        console.error('❌ Missing Google OAuth credentials')
        return false
      }

      console.log('Step 1: Making token refresh request...')
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

      console.log('Token refresh response:', {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Failed to refresh token:', {
          status: response.status,
          statusText: response.statusText,
          errorText
        })
        return false
      }

      const data = await response.json()
      console.log('Token refresh response data:', {
        hasAccessToken: !!data.access_token,
        accessTokenLength: data.access_token?.length || 0,
        expiresIn: data.expires_in,
        tokenType: data.token_type,
        scope: data.scope
      })
      
      // Update tokens in Supabase
      console.log('Step 2: Updating tokens in database...')
      const { error } = await supabase
        .from('gmail_tokens')
        .update({
          access_token: data.access_token,
          expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)

      if (error) {
        console.error('❌ Error updating refreshed tokens:', error)
        return false
      }

      console.log('✅ Access token refreshed successfully')
      console.log('=== REFRESH ACCESS TOKEN SUCCESS ===')
      return true
    } catch (error) {
      console.error('=== REFRESH ACCESS TOKEN FAILED ===')
      console.error('❌ Error refreshing access token:', error)
      console.error('Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : 'Unknown',
        stack: error instanceof Error ? error.stack : 'No stack'
      })
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