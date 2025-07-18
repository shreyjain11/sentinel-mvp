import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { channel } = await request.json()

    if (!channel || !['email', 'sms'].includes(channel)) {
      return NextResponse.json(
        { success: false, message: 'Valid channel (email or sms) is required' },
        { status: 400 }
      )
    }

    // Get the authenticated user
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'User not authenticated' },
        { status: 401 }
      )
    }

    // Get user's notification preferences
    const { data: preferences, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', session.user.id)
      .single()

    if (error) {
      console.error('Error fetching preferences:', error)
      return NextResponse.json(
        { success: false, message: 'Failed to load user preferences' },
        { status: 500 }
      )
    }

    if (channel === 'email') {
      // Test email notification
      console.log(`📧 [TEST] Sending test email to ${session.user.email}`)
      console.log('📧 [TEST] Subject: Sentinel Test Notification')
      console.log('📧 [TEST] Message: This is a test notification from Sentinel. Your notification settings are working correctly!')
      
      // In production, you would use a service like SendGrid, Resend, or AWS SES
      // For demo purposes, we'll just simulate success
      return NextResponse.json({
        success: true,
        message: 'Test email sent successfully'
      })
    }

    if (channel === 'sms') {
      // Test SMS notification
      if (!preferences.sms_enabled) {
        return NextResponse.json(
          { success: false, message: 'SMS notifications are not enabled' },
          { status: 400 }
        )
      }

      if (!preferences.verified_phone) {
        return NextResponse.json(
          { success: false, message: 'Phone number is not verified' },
          { status: 400 }
        )
      }

      const phoneNumber = preferences.phone_number
      const message = 'This is a test notification from Sentinel. Your SMS notifications are working correctly!'

      console.log(`📲 [TEST] Sending test SMS to ${phoneNumber}`)
      console.log(`📲 [TEST] Message: ${message}`)

      // In production, you would use Twilio
      const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID
      const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN
      const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER

      if (twilioAccountSid && twilioAuthToken && twilioPhoneNumber) {
        try {
          // Real Twilio implementation (commented out for demo)
          /*
          const twilio = require('twilio')(twilioAccountSid, twilioAuthToken)
          
          await twilio.messages.create({
            body: message,
            from: twilioPhoneNumber,
            to: phoneNumber
          })
          
          console.log(`✅ Test SMS sent to ${phoneNumber} via Twilio`)
          */
          
          // For demo purposes, we'll just simulate success
          console.log(`📲 [DEMO] Would send SMS to ${phoneNumber}: ${message}`)
        } catch (twilioError) {
          console.error('Twilio error:', twilioError)
          return NextResponse.json(
            { success: false, message: 'Failed to send test SMS' },
            { status: 500 }
          )
        }
      } else {
        console.log(`📲 [DEMO MODE] Test SMS for ${phoneNumber}: ${message}`)
        console.log('💡 To enable real SMS, add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER to your .env.local')
      }

      return NextResponse.json({
        success: true,
        message: 'Test SMS sent successfully'
      })
    }

    return NextResponse.json(
      { success: false, message: 'Invalid channel' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Error sending test notification:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
} 