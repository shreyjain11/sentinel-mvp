import { NextRequest, NextResponse } from 'next/server'
import { SubscriptionService } from '@/lib/subscriptions'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
    }

    // Get the current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'UNAUTHENTICATED' 
      }, { 
        status: 401,
        headers: corsHeaders
      })
    }

    const userId = session.user.id
    const body = await request.json()
    
    console.log('🔌 Extension data received:', body)
    
    // Validate required fields
    if (!body.service || !body.domain || !body.confidence) {
      return NextResponse.json({ 
        error: 'Missing required fields: service, domain, confidence',
        code: 'INVALID_DATA'
      }, { 
        status: 400,
        headers: corsHeaders
      })
    }

    // Map extension data to subscription format
    const subscriptionData = {
      name: `${body.service} ${body.trial_detected ? 'Trial' : 'Subscription'}`,
      service: body.service,
      type: (body.trial_detected ? 'trial' : 'subscription') as 'trial' | 'subscription',
      status: 'active' as const,
      amount: body.extracted_info?.price ? parseFloat(body.extracted_info.price.replace(/[^0-9.]/g, '')) : undefined,
      currency: 'USD',
      billing_cycle: 'monthly' as const,
      start_date: body.extracted_info?.start_date || new Date().toISOString().split('T')[0],
      end_date: body.extracted_info?.trial_length ? 
        new Date(Date.now() + (parseInt(body.extracted_info.trial_length) || 30) * 24 * 60 * 60 * 1000).toISOString().split('T')[0] :
        new Date().toISOString().split('T')[0],
      trial_end_date: body.trial_detected && body.extracted_info?.trial_length ?
        new Date(Date.now() + (parseInt(body.extracted_info.trial_length) || 30) * 24 * 60 * 60 * 1000).toISOString().split('T')[0] :
        undefined,
      auto_renew: true,
      category: body.category || SubscriptionService.getCategoryFromService(body.service),
      website: `https://${body.domain}`,
      notes: `Detected by extension with ${Math.round(body.confidence * 100)}% confidence`,
      confidence_score: body.confidence,
      created_by: 'extension' as const,
      parsed_data: {
        extension_detection: {
          domain: body.domain,
          confidence: body.confidence,
          detection_method: body.detection_method || 'DOM',
          confirmation_text: body.confirmation_text,
          timestamp: body.timestamp,
          user_agent: body.user_agent,
          extracted_info: body.extracted_info
        }
      }
    }

    console.log('🎯 Creating subscription from extension data:', subscriptionData)

    // Check for duplicates to avoid spam
    const existingSubscription = await SubscriptionService.findDuplicateByService(userId, body.service)
    if (existingSubscription) {
      return NextResponse.json({ 
        success: false,
        error: 'Subscription already exists',
        code: 'DUPLICATE_SUBSCRIPTION',
        subscription: existingSubscription
      }, { 
        status: 409,
        headers: corsHeaders
      })
    }

    const result = await SubscriptionService.createSubscription(userId, subscriptionData)
    
    if (result) {
      console.log('✅ Extension subscription created successfully:', result.id)
      return NextResponse.json({ 
        success: true, 
        subscription: result,
        message: `${body.service} subscription added to your dashboard`,
        dashboard_url: `/dashboard?highlight=${result.id}`
      }, {
        headers: corsHeaders
      })
    } else {
      return NextResponse.json({ 
        error: 'Failed to create subscription',
        code: 'CREATION_FAILED'
      }, { 
        status: 500,
        headers: corsHeaders
      })
    }
  } catch (error) {
    console.error('❌ Error in extension subscription creation:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    })
  }
}

// Health check for extension
export async function GET() {
  try {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }

    const { data: { session } } = await supabase.auth.getSession()
    
    return NextResponse.json({ 
      success: true,
      authenticated: !!session,
      user_id: session?.user?.id || null,
      timestamp: new Date().toISOString()
    }, {
      headers: corsHeaders
    })
  } catch (error) {
    return NextResponse.json({ 
      success: false,
      error: 'Health check failed'
    }, { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    })
  }
}

// CORS preflight handler
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}