import { supabase } from './supabase'
import { Subscription } from '@/types'
import { ParsedSubscription } from './gmail'
import { CalendarService } from './calendar'
import { NotificationService } from './notifications'

export class SubscriptionService {
  static async cleanupFakeSubscriptions(): Promise<number> {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        console.error('No active session for cleanup')
        return 0
      }

      // List of fake/incorrect service names to delete
      const fakeServices = [
        'Info Premium',
        'Email Trial', 
        'Google Premium',
        'Canva Trial',
        'Zoom Premium',
        'Figma Premium',
        'Github Trial',
        'Microsoft Premium',
        'Adobe Premium',
        'Spotify Trial',
        'Netflix Premium',
        'Apple Premium',
        'Amazon Premium',
        'Disney Trial',
        'Hulu Trial',
        'YouTube Premium',
        'Slack Premium',
        'Dropbox Premium',
        'Notion Premium',
        'Airtable Premium'
      ]

      console.log('🧹 Auto-cleanup: Removing fake subscriptions...')

      // Delete fake subscriptions and their calendar events
      const { data: deletedSubs, error: deleteError } = await supabase
        .from('subscriptions')
        .delete()
        .eq('user_id', session.user.id)
        .in('service', fakeServices)
        .select()

      if (deleteError) {
        console.error('Cleanup error:', deleteError)
        return 0
      }

      const deletedCount = deletedSubs?.length || 0
      if (deletedCount > 0) {
        console.log(`✅ Auto-cleanup: Removed ${deletedCount} fake subscriptions:`, 
          deletedSubs?.map(sub => sub.service))

        // Clean up calendar events and notifications for deleted subscriptions
        for (const subscription of deletedSubs) {
          await CalendarService.removeSubscriptionEvents(subscription.id)
          await NotificationService.cancelNotificationsForSubscription(subscription.id)
        }
      }

      return deletedCount
    } catch (error) {
      console.error('Exception during auto-cleanup:', error)
      return 0
    }
  }

  static async testConnection(): Promise<boolean> {
    try {
      console.log('Testing Supabase connection...')
      const { data, error } = await supabase
        .from('subscriptions')
        .select('count')
        .limit(1)
      
      if (error) {
        console.error('Connection test failed:', error)
        return false
      }
      
      console.log('Connection test successful')
      return true
    } catch (error) {
      console.error('Connection test exception:', error)
      return false
    }
  }

  static async getSubscriptions(userId: string): Promise<Subscription[]> {
    try {
      console.log('Fetching subscriptions for user:', userId)
      
      // Get the authenticated user's ID from the session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !session) {
        console.error('No active session for fetching subscriptions')
        return []
      }
      
      const authenticatedUserId = session.user.id
      console.log('Using authenticated user ID:', authenticatedUserId)
      
      // Test connection first
      const isConnected = await this.testConnection()
      if (!isConnected) {
        console.error('Database connection failed')
        return []
      }
      
      // Auto-cleanup fake subscriptions before loading
      await this.cleanupFakeSubscriptions()

      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', authenticatedUserId) // Use session user ID
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Supabase error fetching subscriptions:', error)
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        })
        return []
      }

      console.log('Fetched subscriptions:', data)
      return data || []
    } catch (error) {
      console.error('Exception fetching subscriptions:', error)
      return []
    }
  }

  static async createSubscription(userId: string, subscriptionData: Partial<Subscription>): Promise<Subscription | null> {
    try {
      console.log('Creating subscription for user:', userId, 'with data:', subscriptionData)
      
      // Ensure we have a valid session before making the request
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) {
        console.error('Session error:', sessionError)
        return null
      }
      
      if (!session) {
        console.error('No active session for creating subscription')
        return null
      }
      
      console.log('Session found:', {
        userId: session.user.id,
        email: session.user.email,
        accessToken: session.access_token ? 'Present' : 'Missing'
      })
      
      // Use the authenticated user's ID from the session instead of the passed userId
      const authenticatedUserId = session.user.id
      
      const insertData = {
        user_id: authenticatedUserId,
        name: subscriptionData.name || '',
        service: subscriptionData.service || '',
        type: subscriptionData.type || 'subscription',
        status: subscriptionData.status || 'active',
        amount: subscriptionData.amount,
        currency: subscriptionData.currency || 'USD',
        billing_cycle: subscriptionData.billing_cycle || 'monthly',
        start_date: subscriptionData.start_date || new Date().toISOString().split('T')[0],
        end_date: subscriptionData.end_date || new Date().toISOString().split('T')[0],
        renewal_date: subscriptionData.renewal_date,
        trial_end_date: subscriptionData.trial_end_date,
        auto_renew: subscriptionData.auto_renew ?? true,
        category: subscriptionData.category,
        website: subscriptionData.website,
        notes: subscriptionData.notes,
        cancel_url: subscriptionData.cancel_url,
      }
      
      console.log('Inserting subscription data with authenticated user ID:', authenticatedUserId)
      console.log('Insert data:', insertData)
      
      // Test the connection first
      const { data: testData, error: testError } = await supabase
        .from('subscriptions')
        .select('count')
        .limit(1)
      
      if (testError) {
        console.error('Connection test failed:', testError)
        return null
      }
      
      console.log('Connection test successful, proceeding with insert')
      
      const { data, error } = await supabase
        .from('subscriptions')
        .insert([insertData])
        .select()
        .single()

      if (error) {
        console.error('Supabase error creating subscription:', error)
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        })
        
        // Check if it's an authentication error
        if (error.code === 'PGRST116') {
          console.error('Authentication error - user may not be properly authenticated')
        }
        
        // Check if it's a permission error
        if (error.code === '42501' || error.message?.includes('permission')) {
          console.error('Permission error - RLS policies may be blocking the operation')
        }
        
        return null
      }

      console.log('Successfully created subscription:', data)

      // Automatically create calendar events and schedule notifications
      await Promise.all([
        this.createCalendarEventsForSubscription(data),
        this.scheduleNotificationsForSubscription(data)
      ])

      return data
    } catch (error) {
      console.error('Exception creating subscription:', error)
      return null
    }
  }

  static async createFromParsedData(parsedData: ParsedSubscription): Promise<Subscription | null> {
    try {
      console.log('Creating subscription from parsed data:', parsedData)
      
      // Check for duplicates based on service name and source email
      const existingSubscription = await this.findDuplicateSubscription(parsedData)
      if (existingSubscription) {
        console.log(`Duplicate subscription found for ${parsedData.serviceName}, skipping creation`)
        return existingSubscription
      }
      
      const subscriptionData = {
        name: `${parsedData.serviceName} ${parsedData.type === 'trial' ? 'Trial' : 'Premium'}`,
        service: parsedData.serviceName,
        type: parsedData.type,
        status: 'active' as const,
        amount: parsedData.amount,
        currency: parsedData.currency || 'USD',
        billing_cycle: (parsedData.billingCycle as 'monthly' | 'yearly' | 'weekly' | 'daily') || 'monthly',
        start_date: parsedData.startDate || new Date().toISOString().split('T')[0],
        end_date: parsedData.endDate || parsedData.trialEndDate || new Date().toISOString().split('T')[0],
        renewal_date: parsedData.renewalDate,
        trial_end_date: parsedData.trialEndDate,
        auto_renew: parsedData.type === 'subscription',
        category: this.getCategoryFromService(parsedData.serviceName),
        // New fields for AI parsing
        source_email_id: parsedData.sourceEmailId,
        source_email_subject: parsedData.sourceEmailSubject, // Add email subject
        cancel_url: parsedData.cancelUrl,
        confidence_score: parsedData.confidence,
        created_by: 'ai' as const,
        parsed_data: parsedData
      }

      // Get the current session to use the correct user ID
      const { data: { session } } = await supabase.auth.getSession()
      const userId = session?.user?.id || ''
      
      return await this.createSubscriptionWithAIData(userId, subscriptionData)
    } catch (error) {
      console.error('Error creating subscription from parsed data:', error)
      return null
    }
  }

  static async updateSubscription(subscriptionId: string, updates: Partial<Subscription>): Promise<Subscription | null> {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .update(updates)
        .eq('id', subscriptionId)
        .select()
        .single()

      if (error) {
        console.error('Error updating subscription:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error updating subscription:', error)
      return null
    }
  }

  static async deleteSubscription(subscriptionId: string): Promise<boolean> {
    try {
      // Remove calendar events and notifications first
      await Promise.all([
        CalendarService.removeSubscriptionEvents(subscriptionId),
        NotificationService.cancelNotificationsForSubscription(subscriptionId)
      ])

      const { error } = await supabase
        .from('subscriptions')
        .delete()
        .eq('id', subscriptionId)

      if (error) {
        console.error('Error deleting subscription:', error)
        return false
      }

      console.log(`✅ Deleted subscription ${subscriptionId} and associated calendar events and notifications`)
      return true
    } catch (error) {
      console.error('Error deleting subscription:', error)
      return false
    }
  }

  /**
   * Cancel a subscription and remove calendar events and notifications
   */
  static async cancelSubscription(subscriptionId: string): Promise<boolean> {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return false

      // Update subscription status to cancelled
      const { error } = await supabase
        .from('subscriptions')
        .update({ status: 'cancelled' })
        .eq('id', subscriptionId)
        .eq('user_id', session.user.id)

      if (error) {
        console.error('Error cancelling subscription:', error)
        return false
      }

      // Remove associated calendar events and cancel notifications
      await Promise.all([
        CalendarService.removeSubscriptionEvents(subscriptionId),
        NotificationService.cancelNotificationsForSubscription(subscriptionId)
      ])

      console.log(`🚫 Cancelled subscription ${subscriptionId} and removed calendar events and notifications`)
      return true
    } catch (error) {
      console.error('Error cancelling subscription:', error)
      return false
    }
  }

  static async findDuplicateSubscription(parsedData: ParsedSubscription): Promise<Subscription | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return null

      // Look for existing subscription with same service and source email
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('service', parsedData.serviceName)
        .eq('source_email_id', parsedData.sourceEmailId)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking for duplicates:', error)
        return null
      }

      // Also check for recent subscriptions with same service (within 7 days)
      if (!data) {
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

        const { data: recentData, error: recentError } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', session.user.id)
          .eq('service', parsedData.serviceName)
          .gte('created_at', sevenDaysAgo.toISOString())
          .single()

        if (recentError && recentError.code !== 'PGRST116') {
          console.error('Error checking for recent duplicates:', recentError)
        }

        return recentData || null
      }

      return data
    } catch (error) {
      console.error('Error finding duplicate subscription:', error)
      return null
    }
  }

  static async createSubscriptionWithAIData(userId: string, subscriptionData: any): Promise<Subscription | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        console.error('No active session for creating AI subscription')
        return null
      }

      const insertData = {
        user_id: session.user.id,
        name: subscriptionData.name || '',
        service: subscriptionData.service || '',
        type: subscriptionData.type || 'subscription',
        status: subscriptionData.status || 'active',
        amount: subscriptionData.amount,
        currency: subscriptionData.currency || 'USD',
        billing_cycle: subscriptionData.billing_cycle || 'monthly',
        start_date: subscriptionData.start_date || new Date().toISOString().split('T')[0],
        end_date: subscriptionData.end_date || new Date().toISOString().split('T')[0],
        renewal_date: subscriptionData.renewal_date,
        trial_end_date: subscriptionData.trial_end_date,
        auto_renew: subscriptionData.auto_renew ?? true,
        category: subscriptionData.category,
        website: subscriptionData.website,
        notes: subscriptionData.notes,
        source_email_id: subscriptionData.source_email_id,
        cancel_url: subscriptionData.cancel_url,
        confidence_score: subscriptionData.confidence_score,
        created_by: subscriptionData.created_by || 'ai',
        parsed_data: subscriptionData.parsed_data
      }

      console.log('Creating AI-parsed subscription:', insertData)

      const { data, error } = await supabase
        .from('subscriptions')
        .insert([insertData])
        .select()
        .single()

      if (error) {
        console.error('Error creating AI subscription:', error)
        console.error('Error details:', JSON.stringify(error, null, 2))
        console.error('Insert data that failed:', JSON.stringify(insertData, null, 2))
        return null
      }

      console.log('Successfully created AI subscription:', data)
      return data
    } catch (error) {
      console.error('Exception creating AI subscription:', error)
      return null
    }
  }

  /**
   * Create calendar events for a new subscription
   */
  static async createCalendarEventsForSubscription(subscription: Subscription): Promise<void> {
    try {
      const isCalendarConnected = await CalendarService.isCalendarConnected()
      if (!isCalendarConnected) {
        console.log('📅 Calendar not connected, skipping event creation')
        return
      }

      // Create renewal event if renewal_date exists
      if (subscription.renewal_date) {
        const eventId = await CalendarService.createSubscriptionEvent(
          subscription.name,
          subscription.id,
          subscription.renewal_date,
          'renewal',
          subscription.cancel_url
        )
        console.log(`📅 Created renewal calendar event: ${eventId}`)
      }

      // Create trial end event if trial_end_date exists
      if (subscription.trial_end_date) {
        const eventId = await CalendarService.createSubscriptionEvent(
          subscription.name,
          subscription.id,
          subscription.trial_end_date,
          'trial_end',
          subscription.cancel_url
        )
        console.log(`📅 Created trial end calendar event: ${eventId}`)
      }
    } catch (error) {
      console.error('Error creating calendar events for subscription:', error)
    }
  }

  /**
   * Schedule notifications for a new subscription
   */
  static async scheduleNotificationsForSubscription(subscription: Subscription): Promise<void> {
    try {
      await NotificationService.scheduleNotificationsForSubscription(subscription)
      console.log(`🔔 Scheduled notifications for subscription: ${subscription.name}`)
    } catch (error) {
      console.error('Error scheduling notifications for subscription:', error)
    }
  }

  static getCategoryFromService(serviceName: string): string {
    const service = serviceName.toLowerCase()
    
    if (['netflix', 'spotify', 'youtube', 'disney', 'hulu', 'apple'].includes(service)) {
      return 'Entertainment'
    }
    if (['microsoft', 'adobe', 'figma', 'notion', 'slack', 'zoom', 'dropbox', 'github'].includes(service)) {
      return 'Productivity'
    }
    if (['amazon', 'stripe', 'shopify'].includes(service)) {
      return 'Shopping'
    }
    if (['google'].includes(service)) {
      return 'Technology'
    }
    
    return 'Other'
  }

  static async findDuplicateByService(userId: string, serviceName: string): Promise<Subscription | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return null

      // Look for existing subscription with same service (within last 7 days to avoid old cancelled ones)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('service', serviceName)
        .eq('status', 'active')
        .gte('created_at', sevenDaysAgo.toISOString())
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking for service duplicates:', error)
        return null
      }

      return data || null
    } catch (error) {
      console.error('Error finding duplicate by service:', error)
      return null
    }
  }
} 