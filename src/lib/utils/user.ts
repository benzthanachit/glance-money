import { createClient } from '@/lib/supabase/server'

/**
 * Ensures that a user profile exists in the users table
 * Creates one if it doesn't exist
 */
export async function ensureUserProfile(userId: string, email: string) {
  const supabase = await createClient()

  // Check if user exists
  const { data: existingUser, error: fetchError } = await supabase
    .from('users')
    .select('id')
    .eq('id', userId)
    .single()

  // If user doesn't exist (PGRST116 is "not found" error), create them
  if (fetchError && fetchError.code === 'PGRST116') {
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        id: userId,
        email: email,
        preferences: {
          language: 'th',
          currency: 'THB',
          theme: 'system'
        }
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating user profile:', insertError)
      throw new Error('Failed to create user profile')
    }

    return { user: newUser, created: true }
  } else if (fetchError) {
    console.error('Error checking user profile:', fetchError)
    throw new Error('Failed to verify user profile')
  }

  return { user: existingUser, created: false }
}

/**
 * Gets or creates a user profile
 */
export async function getOrCreateUserProfile(userId: string, email: string) {
  const supabase = await createClient()

  // Try to get existing user first
  const { data: existingUser, error: fetchError } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (!fetchError) {
    return { user: existingUser, created: false }
  }

  // If user doesn't exist, create them
  if (fetchError.code === 'PGRST116') {
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .upsert({
        id: userId,
        email: email,
        preferences: {
          language: 'th',
          currency: 'THB',
          theme: 'system'
        }
      }, {
        onConflict: 'id'
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating user profile:', insertError)
      throw new Error('Failed to create user profile')
    }

    return { user: newUser, created: true }
  }

  // Other errors
  console.error('Error fetching user profile:', fetchError)
  throw new Error('Failed to fetch user profile')
}