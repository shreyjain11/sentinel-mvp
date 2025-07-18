import { supabase } from './supabase'

export interface CalendarEvent {
  id: string
  title: string
  description: string
  start: string
  end: string
  type: 'renewal' | 'trial_end'
  subscriptionId: string
}

export class CalendarService {
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

      // Check if token is not expired
      const isTokenValid = tokens.expires_at && 
        new Date(tokens.expires_at) > new Date()

      return hasCalendarScope && isTokenValid
    } catch (error) {
      console.error('Error checking calendar connection:', error)
      return false
    }
  }

  /**
   * Connect Google Calendar
   */
  static async connectCalendar(): Promise<boolean> {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        console.error('No active session')
        return false
      }

      // Redirect to Google OAuth with calendar scope
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
      const redirectUri = `${window.location.origin}/auth/gmail/callback`
      
      const params = new URLSearchParams({
        client_id: clientId!,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/gmail.readonly',
        access_type: 'offline',
        prompt: 'consent',
        include_granted_scopes: 'true'
      })

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
      window.location.href = authUrl
      
      return true
    } catch (error) {
      console.error('Error connecting calendar:', error)
      return false
    }
  }

  /**
   * Disconnect Google Calendar
   */
  static async disconnect(): Promise<boolean> {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return false

      // Get current tokens
      const { data: tokens } = await supabase
        .from('gmail_tokens')
        .select('scope, access_token')
        .eq('user_id', session.user.id)
        .single()

      if (!tokens) return true // Already disconnected

      // Remove calendar scope from existing tokens
      let newScope = tokens.scope || ''
      newScope = newScope.replace('https://www.googleapis.com/auth/calendar', '').trim()
      
      // Update tokens with removed calendar scope
      const { error } = await supabase
        .from('gmail_tokens')
        .update({ 
          scope: newScope,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', session.user.id)

      if (error) {
        console.error('Error updating tokens:', error)
        return false
      }

      // Revoke calendar access with Google (optional, but recommended)
      try {
        await fetch(`https://oauth2.googleapis.com/revoke?token=${tokens.access_token}`, {
          method: 'POST'
        })
      } catch (revokeError) {
        console.warn('Could not revoke token with Google:', revokeError)
        // Still consider it successful since we removed it from our database
      }

      console.log('✅ Calendar disconnected successfully')
      return true
    } catch (error) {
      console.error('Error disconnecting calendar:', error)
      return false
    }
  }

  /**
   * Create a calendar event reminder
   */
  static async createReminderEvent(
    title: string,
    description: string,
    dateTime: Date,
    subscriptionId: string
  ): Promise<string | null> {
    try {
      const isConnected = await this.isCalendarConnected()
      if (!isConnected) {
        console.log('Calendar not connected, skipping event creation')
        return null
      }

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return null

      const { data: tokens } = await supabase
        .from('gmail_tokens')
        .select('access_token')
        .eq('user_id', session.user.id)
        .single()

      if (!tokens?.access_token) return null

      // Create calendar event using Google Calendar API
      const event = {
        summary: title,
        description: description,
        start: {
          dateTime: dateTime.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        end: {
          dateTime: new Date(dateTime.getTime() + 30 * 60000).toISOString(), // 30 minutes later
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 }, // 1 day before
            { method: 'popup', minutes: 60 }       // 1 hour before
          ]
        }
      }

      const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(event)
      })

      if (!response.ok) {
        throw new Error(`Calendar API error: ${response.status}`)
      }

      const createdEvent = await response.json()
      console.log('✅ Calendar event created:', createdEvent.id)
      
      return createdEvent.id
    } catch (error) {
      console.error('Error creating calendar event:', error)
      return null
    }
  }

  /**
   * Delete a calendar event
   */
  static async deleteEvent(eventId: string): Promise<boolean> {
    try {
      const isConnected = await this.isCalendarConnected()
      if (!isConnected) return false

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return false

      const { data: tokens } = await supabase
        .from('gmail_tokens')
        .select('access_token')
        .eq('user_id', session.user.id)
        .single()

      if (!tokens?.access_token) return false

      const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`
        }
      })

      if (response.ok || response.status === 404) {
        console.log('✅ Calendar event deleted:', eventId)
        return true
      }

      throw new Error(`Calendar API error: ${response.status}`)
    } catch (error) {
      console.error('Error deleting calendar event:', error)
      return false
    }
  }
} 