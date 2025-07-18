import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

interface UserPreferences {
  default_currency: string
  timezone: string
  date_format: string
  theme: string
  default_billing_cycle: string
  show_amounts: boolean
  auto_categorize: boolean
  email_notifications: boolean
  compact_view: boolean
}

const DEFAULT_PREFERENCES: UserPreferences = {
  default_currency: 'USD',
  timezone: 'America/New_York',
  date_format: 'MM/dd/yyyy',
  theme: 'light',
  default_billing_cycle: 'monthly',
  show_amounts: true,
  auto_categorize: true,
  email_notifications: true,
  compact_view: false
}

const VALID_CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD']
const VALID_DATE_FORMATS = ['MM/dd/yyyy', 'dd/MM/yyyy', 'yyyy-MM-dd']
const VALID_THEMES = ['light', 'dark', 'auto']
const VALID_BILLING_CYCLES = ['daily', 'weekly', 'monthly', 'yearly']

export async function GET(request: NextRequest) {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      return NextResponse.json({ 
        error: 'Authentication required' 
      }, { status: 401 })
    }

    // For now, we'll store preferences in localStorage on the client side
    // In the future, we could create a user_preferences table in the database
    
    return NextResponse.json({
      success: true,
      preferences: DEFAULT_PREFERENCES,
      message: 'Default preferences returned. Preferences are stored locally in your browser.'
    })
  } catch (error) {
    console.error('Preferences fetch error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      return NextResponse.json({ 
        error: 'Authentication required' 
      }, { status: 401 })
    }

    const body = await request.json()
    const preferences = body.preferences

    if (!preferences || typeof preferences !== 'object') {
      return NextResponse.json({ 
        error: 'Invalid preferences data' 
      }, { status: 400 })
    }

    // Validate preferences
    const validationErrors: string[] = []

    if (preferences.default_currency && !VALID_CURRENCIES.includes(preferences.default_currency)) {
      validationErrors.push(`Invalid currency: ${preferences.default_currency}`)
    }

    if (preferences.date_format && !VALID_DATE_FORMATS.includes(preferences.date_format)) {
      validationErrors.push(`Invalid date format: ${preferences.date_format}`)
    }

    if (preferences.theme && !VALID_THEMES.includes(preferences.theme)) {
      validationErrors.push(`Invalid theme: ${preferences.theme}`)
    }

    if (preferences.default_billing_cycle && !VALID_BILLING_CYCLES.includes(preferences.default_billing_cycle)) {
      validationErrors.push(`Invalid billing cycle: ${preferences.default_billing_cycle}`)
    }

    if (validationErrors.length > 0) {
      return NextResponse.json({ 
        error: 'Validation failed',
        details: validationErrors 
      }, { status: 400 })
    }

    // For now, we're storing preferences client-side
    // In the future, we could store them in a database table
    
    return NextResponse.json({
      success: true,
      message: 'Preferences validated successfully. Store them in localStorage.',
      preferences: {
        ...DEFAULT_PREFERENCES,
        ...preferences
      }
    })
  } catch (error) {
    console.error('Preferences update error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      return NextResponse.json({ 
        error: 'Authentication required' 
      }, { status: 401 })
    }

    // Reset preferences to defaults
    return NextResponse.json({
      success: true,
      preferences: DEFAULT_PREFERENCES,
      message: 'Preferences reset to defaults'
    })
  } catch (error) {
    console.error('Preferences reset error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
} 