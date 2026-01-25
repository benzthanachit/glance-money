import { createClient } from '@/lib/supabase/client'

/**
 * Sign up with development-friendly settings
 * Skips email verification in development mode
 */
export async function signUpWithEmail(email: string, password: string) {
  const supabase = createClient()
  
  const isDevelopment = process.env.NODE_ENV === 'development'
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
      ...(isDevelopment && {
        data: {
          email_confirm: false
        }
      })
    }
  })

  return { data, error }
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail(email: string, password: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  return { data, error }
}

/**
 * Sign out current user
 */
export async function signOut() {
  const supabase = createClient()
  
  const { error } = await supabase.auth.signOut()
  
  return { error }
}

/**
 * Get current user session
 */
export async function getCurrentUser() {
  const supabase = createClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  return { user, error }
}

/**
 * Ensure user profile exists after authentication
 */
export async function ensureUserProfileExists() {
  try {
    const response = await fetch('/api/auth/user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error('Failed to ensure user profile exists')
    }

    const result = await response.json()
    return { success: true, user: result.user }
  } catch (error) {
    console.error('Failed to ensure user profile:', error)
    return { success: false, error }
  }
}