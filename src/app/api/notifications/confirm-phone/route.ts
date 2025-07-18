import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Type declaration for global verification codes
declare global {
  var verificationCodes: { [key: string]: { code: string; expires: number } } | undefined
}

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, code } = await request.json()

    if (!phoneNumber || !code) {
      return NextResponse.json(
        { success: false, message: 'Phone number and verification code are required' },
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

    // Check verification code
    const storedVerification = global.verificationCodes?.[phoneNumber]
    
    if (!storedVerification) {
      return NextResponse.json(
        { success: false, message: 'No verification code found for this phone number' },
        { status: 400 }
      )
    }

    // Check if code has expired
    if (Date.now() > storedVerification.expires) {
      // Clean up expired code
      if (global.verificationCodes) {
        delete global.verificationCodes[phoneNumber]
      }
      return NextResponse.json(
        { success: false, message: 'Verification code has expired' },
        { status: 400 }
      )
    }

    // Check if code matches
    if (storedVerification.code !== code) {
      return NextResponse.json(
        { success: false, message: 'Invalid verification code' },
        { status: 400 }
      )
    }

    // Code is valid - clean up and mark as verified
    if (global.verificationCodes) {
      delete global.verificationCodes[phoneNumber]
    }

    console.log(`✅ Phone ${phoneNumber} verified successfully for user ${session.user.id}`)

    return NextResponse.json({
      success: true,
      message: 'Phone number verified successfully'
    })

  } catch (error) {
    console.error('Error confirming phone verification:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
} 