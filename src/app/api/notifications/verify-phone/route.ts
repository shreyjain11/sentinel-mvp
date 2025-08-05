import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

// Type declaration for global verification codes
declare global {
  var verificationCodes: { [key: string]: { code: string; expires: number } } | undefined
}

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber } = await request.json()

    if (!phoneNumber) {
      return NextResponse.json(
        { success: false, message: 'Phone number is required' },
        { status: 400 }
      )
    }

    // Get the authenticated user using server-side client
    const supabase = createSupabaseServerClient(request)
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('Session error:', sessionError)
      return NextResponse.json(
        { success: false, message: 'Session error' },
        { status: 401 }
      )
    }
    
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'User not authenticated' },
        { status: 401 }
      )
    }

    // For MVP, simulate SMS verification (replace with Twilio in production)
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
    
    
    // In production, you would:
    // 1. Use Twilio to send the SMS
    // 2. Store the verification code securely (with expiration)
    // 3. Hash the code before storing
    
    // For now, we'll just log it for testing purposes
    console.log(`📱 SMS Verification Code for ${phoneNumber}: ${verificationCode}`)
    
    // Store verification code temporarily (in production, use Redis or database with TTL)
    // For now, we'll use a simple in-memory store (this won't work in production)
    if (!global.verificationCodes) {
      global.verificationCodes = {}
    }
    global.verificationCodes[phoneNumber] = {
      code: verificationCode,
      expires: Date.now() + 10 * 60 * 1000 // 10 minutes
    }

    // Simulate Twilio SMS sending
    const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID
    const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN
    const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER

    if (twilioAccountSid && twilioAuthToken && twilioPhoneNumber) {
      try {
        // Real Twilio implementation (commented out for demo)
        /*
        const twilio = require('twilio')(twilioAccountSid, twilioAuthToken)
        
        await twilio.messages.create({
          body: `Your Sentinel verification code is: ${verificationCode}. This code expires in 10 minutes.`,
          from: twilioPhoneNumber,
          to: phoneNumber
        })
        
        console.log(`✅ SMS sent to ${phoneNumber} via Twilio`)
        */
        
        // For demo purposes, we'll just simulate success
        console.log(`📲 [DEMO] Would send SMS to ${phoneNumber}: Your Sentinel verification code is: ${verificationCode}`)
      } catch (twilioError) {
        console.error('Twilio error:', twilioError)
        return NextResponse.json(
          { success: false, message: 'Failed to send SMS' },
          { status: 500 }
        )
      }
    } else {
      console.log(`📲 [DEMO MODE] SMS verification code for ${phoneNumber}: ${verificationCode}`)
      console.log('💡 To enable real SMS, add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER to your .env.local')
    }

    return NextResponse.json({
      success: true,
      message: 'Verification code sent successfully'
    })

  } catch (error) {
    console.error('Error sending phone verification:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
} 