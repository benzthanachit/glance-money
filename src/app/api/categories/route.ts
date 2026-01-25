import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/categories - Get all categories
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user (optional for categories, but good for consistency)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'income', 'expense', or 'both'

    // Build query
    let query = supabase
      .from('categories')
      .select('*')
      .order('name')

    // Apply type filter
    if (type && (type === 'income' || type === 'expense' || type === 'both')) {
      query = query.or(`type.eq.${type},type.eq.both`)
    }

    const { data: categories, error } = await query

    if (error) {
      console.error('Error fetching categories:', error)
      return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
    }

    return NextResponse.json({ categories })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}