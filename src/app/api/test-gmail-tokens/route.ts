import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient(request)
    
    // Test database connection
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      return NextResponse.json({ 
        error: 'Session error', 
        details: sessionError.message 
      }, { status: 401 })
    }

    if (!session) {
      return NextResponse.json({ 
        error: 'No session found' 
      }, { status: 401 })
    }

    // Test if gmail_tokens table exists and is accessible
    const { data: tableInfo, error: tableError } = await supabase
      .from('gmail_tokens')
      .select('id, user_id, created_at')
      .limit(1)

    if (tableError) {
      return NextResponse.json({ 
        error: 'Table access error', 
        details: tableError.message,
        code: tableError.code,
        hint: tableError.hint
      }, { status: 500 })
    }

    // Check if user already has a token record
    const { data: existingToken, error: selectError } = await supabase
      .from('gmail_tokens')
      .select('id, access_token, scope, expires_at')
      .eq('user_id', session.user.id)
      .single()

    if (selectError && selectError.code !== 'PGRST116') { // PGRST116 = no rows returned
      return NextResponse.json({ 
        error: 'Select test failed', 
        details: selectError.message,
        code: selectError.code,
        hint: selectError.hint
      }, { status: 500 })
    }

    if (existingToken) {
      // User already has a token - test update instead of insert
      const testUpdateData = {
        access_token: 'test_token_updated',
        refresh_token: 'test_refresh_updated',
        expires_at: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
        scope: 'test_scope_updated',
        updated_at: new Date().toISOString()
      }

      const { data: updateResult, error: updateError } = await supabase
        .from('gmail_tokens')
        .update(testUpdateData)
        .eq('user_id', session.user.id)
        .select()

      if (updateError) {
        return NextResponse.json({ 
          error: 'Update test failed', 
          details: updateError.message,
          code: updateError.code,
          hint: updateError.hint
        }, { status: 500 })
      }

      // Restore original data
      await supabase
        .from('gmail_tokens')
        .update({
          access_token: existingToken.access_token,
          scope: existingToken.scope,
          expires_at: existingToken.expires_at,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', session.user.id)

      return NextResponse.json({ 
        success: true,
        message: 'Gmail tokens table is working correctly (update test passed)',
        userId: session.user.id,
        tableAccessible: true,
        updateTestPassed: true,
        existingTokenFound: true
      })
    } else {
      // No existing token - test insert
      const testData = {
        user_id: session.user.id,
        access_token: 'test_token',
        refresh_token: 'test_refresh',
        expires_at: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
        scope: 'test_scope'
      }

      const { data: insertData, error: insertError } = await supabase
        .from('gmail_tokens')
        .upsert(testData)
        .select()

      if (insertError) {
        return NextResponse.json({ 
          error: 'Insert test failed', 
          details: insertError.message,
          code: insertError.code,
          hint: insertError.hint
        }, { status: 500 })
      }

      // Clean up test data
      if (insertData && insertData.length > 0) {
        await supabase
          .from('gmail_tokens')
          .delete()
          .eq('id', insertData[0].id)
      }

      return NextResponse.json({ 
        success: true,
        message: 'Gmail tokens table is working correctly (insert test passed)',
        userId: session.user.id,
        tableAccessible: true,
        insertTestPassed: true,
        existingTokenFound: false
      })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Gmail tokens table is working correctly',
      userId: session.user.id,
      tableAccessible: true,
      insertTestPassed: true
    })

  } catch (error) {
    console.error('Test Gmail tokens error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 