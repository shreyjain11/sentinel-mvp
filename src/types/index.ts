export interface User {
  id: string
  email: string
  name?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface Subscription {
  id: string
  user_id: string
  name: string
  service: string
  type: 'trial' | 'subscription'
  status: 'active' | 'expired' | 'cancelled'
  amount?: number
  currency?: string
  billing_cycle: 'monthly' | 'yearly' | 'weekly' | 'daily'
  start_date: string
  end_date: string
  renewal_date?: string
  trial_end_date?: string
  auto_renew: boolean
  category?: string
  website?: string
  notes?: string
  // Calendar integration fields
  renewal_calendar_event_id?: string
  trial_calendar_event_id?: string
  // AI parsing fields
  source_email_id?: string
  cancel_url?: string
  confidence_score?: number
  created_by?: 'manual' | 'ai' | 'import' | 'extension'
  parsed_data?: any
  created_at: string
  updated_at: string
}

export interface Notification {
  id: string
  user_id: string
  subscription_id: string
  type: 'trial_ending' | 'renewal_reminder' | 'payment_failed' | 'price_change'
  title: string
  message: string
  scheduled_for: string
  sent_at?: string
  read: boolean
  created_at: string
}

export interface NotificationPreferences {
  id: string
  user_id: string
  // Notification channels
  email_enabled: boolean
  sms_enabled: boolean
  push_enabled: boolean
  // Contact info
  phone_number?: string
  verified_phone: boolean
  // Timing (days before event)
  trial_end_days_before: number
  renewal_days_before: number
  // Notification types
  trial_ending_enabled: boolean
  renewal_reminder_enabled: boolean
  price_change_enabled: boolean
  created_at: string
  updated_at: string
}

export interface ScheduledNotification {
  id: string
  user_id: string
  subscription_id: string
  notification_type: 'trial_ending' | 'renewal_reminder' | 'price_change' | 'unused_subscription'
  channel: 'email' | 'sms' | 'push'
  scheduled_for: string
  sent_at?: string
  title: string
  message: string
  action_url?: string
  status: 'pending' | 'sent' | 'failed' | 'cancelled'
  failure_reason?: string
  retry_count: number
  created_at: string
  updated_at: string
}

export interface EmailData {
  id: string
  subject: string
  sender: string
  body: string
  received_at: string
  parsed_data?: {
    service_name?: string
    amount?: number
    currency?: string
    trial_end?: string
    renewal_date?: string
    subscription_type?: 'trial' | 'subscription'
  }
}

export interface SavingsGoal {
  id: string
  user_id: string
  name: string
  target_amount: number
  current_amount: number
  currency: string
  created_at: string
  updated_at: string
}

export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  criteria: string
  earned_at?: string
}

export interface UserStats {
  total_subscriptions: number
  active_trials: number
  monthly_spend: number
  total_savings: number
  badges_earned: number
} 

export interface SubscriptionData {
  id: string
  name: string
  service: string
  type: 'trial' | 'subscription'
  status: 'active' | 'expired' | 'cancelled'
  amount: number
  currency: string
  billing_cycle: 'monthly' | 'yearly' | 'weekly' | 'daily'
}

export interface SubscriptionManager {
  addSubscription(subscription: SubscriptionData): void
  updateSubscription(subscription: SubscriptionData): void
  deleteSubscription(id: string): void
  getSubscriptions(): SubscriptionData[]
  getSubscription(id: string): SubscriptionData | null
}