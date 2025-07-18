import { NextRequest, NextResponse } from 'next/server'
import { EmailParser } from '@/lib/email-parser'
import { EmailData } from '@/types'

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

    // Parse the email using our AI-powered parser
    const parsedData = await EmailParser.parseEmail(email)

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