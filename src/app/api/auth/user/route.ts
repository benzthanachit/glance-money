import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/auth/user - Get or create user profile
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user exists in our users table
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching user:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
    }

    // If user doesn't exist, create them
    if (!existingUser) {
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          email: user.email || '',
          preferences: {
            language: 'th',
            currency: 'THB',
            theme: 'system'
          }
        })
        .select()
        .single()

      if (insertError) {
        console.error('Error creating user:', insertError)
        return NextResponse.json({ error: 'Failed to create user profile' }, { status: 500 })
      }

      return NextResponse.json({ user: newUser, created: true })
    }

    return NextResponse.json({ user: existingUser, created: false })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/auth/user - Ensure user profile exists
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Try to insert user (will fail if already exists due to unique constraint)
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .upsert({
        id: user.id,
        email: user.email || '',
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
      console.error('Error upserting user:', insertError)
      return NextResponse.json({ error: 'Failed to ensure user profile' }, { status: 500 })
    }

    return NextResponse.json({ user: newUser })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}