import { supabase } from './supabase'
import { NotificationPreferences, ScheduledNotification, Subscription } from '@/types'

export class NotificationService {
  /**
   * Get user's notification preferences
   */
  static async getNotificationPreferences(): Promise<NotificationPreferences | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return null

      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', session.user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        // Check if it's a missing table error
        if (error.message && (error.message.includes('does not exist') || error.message.includes('relation'))) {
          console.warn('Notification preferences table not found. Please run setup-notifications.sql in your Supabase dashboard.')
          return this.getDefaultPreferencesObject(session.user.id)
        }
        console.error('Error fetching notification preferences:', error)
        return null
      }

      // If no preferences exist, create default ones
      if (!data) {
        return await this.createDefaultPreferences()
      }

      return data
    } catch (error) {
      console.error('Error getting notification preferences:', error)
      return null
    }
  }

  /**
   * Get default preferences object without database insertion (for missing tables)
   */
  static getDefaultPreferencesObject(userId: string): NotificationPreferences {
    return {
      id: 'default',
      user_id: userId,
      email_enabled: true,
      sms_enabled: false,
      push_enabled: false,
      phone_number: '',
      verified_phone: false,
      trial_end_days_before: 3,
      renewal_days_before: 3,
      trial_ending_enabled: true,
      renewal_reminder_enabled: true,
      price_change_enabled: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  }

  /**
   * Create default notification preferences for a user
   */
  static async createDefaultPreferences(): Promise<NotificationPreferences | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return null

      const defaultPreferences = {
        user_id: session.user.id,
        email_enabled: true,
        sms_enabled: false,
        push_enabled: false,
        phone_number: null,
        verified_phone: false,
        trial_end_days_before: 3,
        renewal_days_before: 3,
        trial_ending_enabled: true,
        renewal_reminder_enabled: true,
        price_change_enabled: true
      }

      const { data, error } = await supabase
        .from('notification_preferences')
        .insert([defaultPreferences])
        .select()
        .single()

      if (error) {
        console.error('Error creating default preferences:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error creating default preferences:', error)
      return null
    }
  }

  /**
   * Update notification preferences
   */
  static async updateNotificationPreferences(
    preferences: Partial<NotificationPreferences>
  ): Promise<boolean> {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return false

      const { error } = await supabase
        .from('notification_preferences')
        .update(preferences)
        .eq('user_id', session.user.id)

      if (error) {
        console.error('Error updating notification preferences:', error)
        return false
      }

      console.log('✅ Updated notification preferences')
      return true
    } catch (error) {
      console.error('Error updating notification preferences:', error)
      return false
    }
  }

  /**
   * Verify phone number via SMS
   */
  static async sendPhoneVerification(phoneNumber: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch('/api/notifications/verify-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber })
      })

      const result = await response.json()
      return result
    } catch (error) {
      console.error('Error sending phone verification:', error)
      return { success: false, message: 'Failed to send verification' }
    }
  }

  /**
   * Confirm phone verification code
   */
  static async confirmPhoneVerification(phoneNumber: string, code: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch('/api/notifications/confirm-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, code })
      })

      const result = await response.json()
      
      if (result.success) {
        // Update phone as verified
        await this.updateNotificationPreferences({
          phone_number: phoneNumber,
          verified_phone: true
        })
      }

      return result
    } catch (error) {
      console.error('Error confirming phone verification:', error)
      return { success: false, message: 'Failed to confirm verification' }
    }
  }

  /**
   * Schedule notifications for a subscription
   */
  static async scheduleNotificationsForSubscription(subscription: Subscription): Promise<void> {
    try {
      const preferences = await this.getNotificationPreferences()
      if (!preferences) return

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const notifications: Partial<ScheduledNotification>[] = []

      // Schedule trial ending notification
      if (subscription.trial_end_date && preferences.trial_ending_enabled) {
        const trialEndDate = new Date(subscription.trial_end_date)
        const notificationDate = new Date(trialEndDate)
        notificationDate.setDate(notificationDate.getDate() - preferences.trial_end_days_before)

        if (notificationDate > new Date()) {
          const title = `Trial ending soon: ${subscription.name}`
          const message = `Your ${subscription.name} trial ends in ${preferences.trial_end_days_before} days. Don't forget to cancel if you don't want to be charged.`

          // Schedule email notification
          if (preferences.email_enabled) {
            notifications.push({
              user_id: session.user.id,
              subscription_id: subscription.id,
              notification_type: 'trial_ending',
              channel: 'email',
              scheduled_for: notificationDate.toISOString(),
              title,
              message,
              action_url: subscription.cancel_url
            })
          }

          // Schedule SMS notification
          if (preferences.sms_enabled && preferences.verified_phone) {
            notifications.push({
              user_id: session.user.id,
              subscription_id: subscription.id,
              notification_type: 'trial_ending',
              channel: 'sms',
              scheduled_for: notificationDate.toISOString(),
              title,
              message: `${title}. ${subscription.cancel_url ? `Cancel: ${subscription.cancel_url}` : ''}`,
              action_url: subscription.cancel_url
            })
          }
        }
      }

      // Schedule renewal reminder notification
      if (subscription.renewal_date && preferences.renewal_reminder_enabled) {
        const renewalDate = new Date(subscription.renewal_date)
        const notificationDate = new Date(renewalDate)
        notificationDate.setDate(notificationDate.getDate() - preferences.renewal_days_before)

        if (notificationDate > new Date()) {
          const title = `Renewal reminder: ${subscription.name}`
          const message = `Your ${subscription.name} subscription renews in ${preferences.renewal_days_before} days for ${subscription.currency}${subscription.amount}.`

          // Schedule email notification
          if (preferences.email_enabled) {
            notifications.push({
              user_id: session.user.id,
              subscription_id: subscription.id,
              notification_type: 'renewal_reminder',
              channel: 'email',
              scheduled_for: notificationDate.toISOString(),
              title,
              message,
              action_url: subscription.cancel_url
            })
          }

          // Schedule SMS notification
          if (preferences.sms_enabled && preferences.verified_phone) {
            notifications.push({
              user_id: session.user.id,
              subscription_id: subscription.id,
              notification_type: 'renewal_reminder',
              channel: 'sms',
              scheduled_for: notificationDate.toISOString(),
              title,
              message: `${title}. ${subscription.cancel_url ? `Cancel: ${subscription.cancel_url}` : ''}`,
              action_url: subscription.cancel_url
            })
          }
        }
      }

      // Insert notifications into database
      if (notifications.length > 0) {
        const { error } = await supabase
          .from('scheduled_notifications')
          .insert(notifications)

        if (error) {
          console.error('Error scheduling notifications:', error)
        } else {
          console.log(`📅 Scheduled ${notifications.length} notifications for ${subscription.name}`)
        }
      }
    } catch (error) {
      console.error('Error scheduling notifications for subscription:', error)
    }
  }

  /**
   * Cancel notifications for a subscription
   */
  static async cancelNotificationsForSubscription(subscriptionId: string): Promise<void> {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { error } = await supabase
        .from('scheduled_notifications')
        .update({ status: 'cancelled' })
        .eq('subscription_id', subscriptionId)
        .eq('user_id', session.user.id)
        .eq('status', 'pending')

      if (error) {
        console.error('Error cancelling notifications:', error)
      } else {
        console.log(`🚫 Cancelled notifications for subscription ${subscriptionId}`)
      }
    } catch (error) {
      console.error('Error cancelling notifications:', error)
    }
  }

  /**
   * Get pending notifications for processing
   */
  static async getPendingNotifications(): Promise<ScheduledNotification[]> {
    try {
      const now = new Date()
      const { data, error } = await supabase
        .from('scheduled_notifications')
        .select('*')
        .eq('status', 'pending')
        .lte('scheduled_for', now.toISOString())
        .order('scheduled_for', { ascending: true })
        .limit(100)

      if (error) {
        console.error('Error fetching pending notifications:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error getting pending notifications:', error)
      return []
    }
  }

  /**
   * Send email notification
   */
  static async sendEmailNotification(notification: ScheduledNotification): Promise<boolean> {
    try {
      // Get user session to get email
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        console.error('No session found for email notification')
        return false
      }

      // Determine email type and template data based on notification
      let emailType = 'custom'
      let templateData = null

      if (notification.title.includes('trial') || notification.title.includes('Trial')) {
        emailType = 'trial_ending'
        templateData = {
          serviceName: notification.title.replace(/trial|Trial|ending|Ending/gi, '').trim(),
          daysLeft: 3, // Default, could be extracted from message
          endDate: notification.scheduled_for
        }
      } else if (notification.title.includes('renewal') || notification.title.includes('Renewal')) {
        emailType = 'renewal_reminder'
        templateData = {
          serviceName: notification.title.replace(/renewal|Renewal|reminder|Reminder/gi, '').trim(),
          amount: '$9.99', // Default, could be extracted from message
          renewalDate: notification.scheduled_for
        }
      } else if (notification.title.includes('price') || notification.title.includes('Price')) {
        emailType = 'price_change'
        templateData = {
          serviceName: notification.title.replace(/price|Price|change|Change/gi, '').trim(),
          oldPrice: '$9.99', // Default, could be extracted from message
          newPrice: '$12.99' // Default, could be extracted from message
        }
      }

      const response = await fetch('/api/notifications/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: session.user.email,
          subject: notification.title,
          message: notification.message,
          type: emailType,
          templateData: templateData
        })
      })

      const result = await response.json()
      return result.success
    } catch (error) {
      console.error('Error sending email notification:', error)
      return false
    }
  }

  /**
   * Send SMS notification
   */
  static async sendSmsNotification(notification: ScheduledNotification): Promise<boolean> {
    try {
      const response = await fetch('/api/notifications/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notification)
      })

      const result = await response.json()
      return result.success
    } catch (error) {
      console.error('Error sending SMS notification:', error)
      return false
    }
  }

  /**
   * Mark notification as sent
   */
  static async markNotificationSent(notificationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('scheduled_notifications')
        .update({ 
          status: 'sent', 
          sent_at: new Date().toISOString() 
        })
        .eq('id', notificationId)

      if (error) {
        console.error('Error marking notification as sent:', error)
      }
    } catch (error) {
      console.error('Error marking notification as sent:', error)
    }
  }

  /**
   * Mark notification as failed
   */
  static async markNotificationFailed(notificationId: string, reason: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('scheduled_notifications')
        .update({ 
          status: 'failed', 
          failure_reason: reason,
          retry_count: supabase.rpc('increment_retry_count', { notification_id: notificationId })
        })
        .eq('id', notificationId)

      if (error) {
        console.error('Error marking notification as failed:', error)
      }
    } catch (error) {
      console.error('Error marking notification as failed:', error)
    }
  }

  /**
   * Get user's scheduled notifications
   */
  static async getUserNotifications(): Promise<ScheduledNotification[]> {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return []

      const { data, error } = await supabase
        .from('scheduled_notifications')
        .select('*')
        .eq('user_id', session.user.id)
        .order('scheduled_for', { ascending: true })

      if (error) {
        // Check if it's a missing table error
        if (error.message && (error.message.includes('does not exist') || error.message.includes('relation'))) {
          console.warn('Scheduled notifications table not found. Please run setup-notifications.sql in your Supabase dashboard.')
          return []
        }
        console.error('Error fetching user notifications:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error getting user notifications:', error)
      return []
    }
  }

  /**
   * Test notification sending
   */
  static async sendTestNotification(channel: 'email' | 'sms'): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch('/api/notifications/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel })
      })

      const result = await response.json()
      return result
    } catch (error) {
      console.error('Error sending test notification:', error)
      return { success: false, message: 'Failed to send test notification' }
    }
  }
} 