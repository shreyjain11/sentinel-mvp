import { supabase } from './supabase'
import { User } from '@/types'

export async function signInWithGoogle() {
  try {
    console.log('Starting Supabase Google OAuth...')
    
    // Determine the correct redirect URI based on current environment
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    const baseUrl = isLocalhost 
      ? (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
      : window.location.origin
    const redirectTo = `${baseUrl}/auth/callback`
    
    console.log('Using redirect URI:', redirectTo)
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })

    if (error) {
      console.error('Supabase OAuth error:', error)
      throw error
    }

    console.log('Supabase OAuth initiated successfully')
    return data
  } catch (error) {
    console.error('Google sign in error:', error)
    throw error
  }
}

export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) {
      throw error
    }
  } catch (error) {
    console.error('Sign out error:', error)
    throw error
  }
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      console.log('No active session')
      return null
    }

    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      console.log('No user found')
      return null
    }

    return {
      id: user.id,
      email: user.email || '',
      name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
      avatar_url: user.user_metadata?.avatar_url,
      created_at: user.created_at || new Date().toISOString(),
      updated_at: user.updated_at || new Date().toISOString()
    }
  } catch (error) {
    console.error('Get current user error:', error)
    return null
  }
}

export async function getSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('Get session error:', error)
      return null
    }

    return session
  } catch (error) {
    console.error('Get session error:', error)
    return null
  }
}

export function onAuthStateChange(callback: (user: User | null) => void) {
  return supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session?.user) {
      const user: User = {
        id: session.user.id,
        email: session.user.email!,
        name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
        avatar_url: session.user.user_metadata?.avatar_url,
        created_at: session.user.created_at,
        updated_at: session.user.updated_at || session.user.created_at,
      }
      callback(user)
    } else if (event === 'SIGNED_OUT') {
      callback(null)
    }
  })
} 