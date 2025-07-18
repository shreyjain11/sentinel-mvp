import { NextRequest, NextResponse } from 'next/server'
import { GmailService } from '@/lib/gmail'

export async function POST(request: NextRequest) {
  try {
    // Parse emails for subscriptions
    const parsedSubscriptions = await GmailService.parseAllEmails()
    
    return NextResponse.json({
      success: true,
      subscriptions: parsedSubscriptions,
      count: parsedSubscriptions.length
    })
  } catch (error) {
    console.error('Error parsing emails:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to parse emails' 
      },
      { status: 500 }
    )
  }
} 