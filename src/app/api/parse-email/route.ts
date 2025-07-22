import { NextRequest, NextResponse } from 'next/server'
import { EmailParser } from '@/lib/email-parser'
import { EmailData } from '@/types'
import { SubscriptionService } from '@/lib/subscriptions'
import { CalendarServerService } from '@/lib/calendar-server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email }: { email: EmailData } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email data is required' },
        { status: 400 }
      )
    }

    // Get authenticated user
    const supabase = createSupabaseServerClient(request)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse the email using our AI-powered parser
    const parsedData = await EmailParser.parseEmail(email)

    // If subscription was found and confirmed, create calendar events
    if (parsedData && parsedData.confidence > 0.7 && parsedData.service_name) {
      try {
        // Convert ParsedEmailData to ParsedSubscription format
        const parsedSubscription = {
          serviceName: parsedData.service_name,
          type: parsedData.subscription_type || 'subscription',
          amount: parsedData.amount,
          currency: parsedData.currency || 'USD',
          billingCycle: 'monthly', // Default
          startDate: new Date().toISOString().split('T')[0],
          endDate: parsedData.renewal_date || new Date().toISOString().split('T')[0],
          trialEndDate: parsedData.trial_end,
          renewalDate: parsedData.renewal_date,
          cancelUrl: undefined,
          confidence: parsedData.confidence,
          sourceEmailId: email.id
        }
        
        // Create subscription from parsed data
        const subscription = await SubscriptionService.createFromParsedData(parsedSubscription)
        
        if (subscription) {
          console.log(`✅ Created subscription: ${subscription.name}`)
          
          // Check if calendar is connected and create events
          const isCalendarConnected = await CalendarServerService.isCalendarConnected()
          if (isCalendarConnected) {
            console.log('📅 Calendar connected, creating events...')
            
            // Create renewal event if renewal_date exists
            if (subscription.renewal_date) {
              const eventId = await CalendarServerService.createSubscriptionEvent(
                subscription.id,
                subscription.name,
                subscription.renewal_date,
                'renewal',
                {
                  originalEmailSubject: email.subject,
                  cancelUrl: subscription.cancel_url,
                  amount: subscription.amount,
                  currency: subscription.currency
                }
              )
              if (eventId) {
                console.log(`✅ Created renewal calendar event: ${eventId}`)
              }
            }

            // Create trial end event if trial_end_date exists
            if (subscription.trial_end_date) {
              const eventId = await CalendarServerService.createSubscriptionEvent(
                subscription.id,
                subscription.name,
                subscription.trial_end_date,
                'trial_end',
                {
                  originalEmailSubject: email.subject,
                  cancelUrl: subscription.cancel_url,
                  amount: subscription.amount,
                  currency: subscription.currency
                }
              )
              if (eventId) {
                console.log(`✅ Created trial end calendar event: ${eventId}`)
              }
            }
          } else {
            console.log('📅 Calendar not connected, skipping event creation')
          }
        }
      } catch (subscriptionError) {
        console.error('Error creating subscription or calendar events:', subscriptionError)
        // Continue with email parsing even if subscription creation fails
      }
    }

    return NextResponse.json({
      success: true,
      data: parsedData
    })

  } catch (error) {
    console.error('Email parsing error:', error)
    return NextResponse.json(
      { error: 'Failed to parse email' },
      { status: 500 }
    )
  }
} 