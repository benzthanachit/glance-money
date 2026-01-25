import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { TransactionInsert } from '@/lib/types/database'
import { validateTransactionData, sanitizeTransactionData } from '@/lib/utils/validation'
import { ensureUserProfile } from '@/lib/utils/user'

// GET /api/transactions - Get all transactions for authenticated user
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = searchParams.get('limit')

    // Build query
    let query = supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })

    // Apply filters
    if (category) {
      query = query.eq('category', category)
    }
    if (startDate) {
      query = query.gte('date', startDate)
    }
    if (endDate) {
      query = query.lte('date', endDate)
    }
    if (limit) {
      query = query.limit(parseInt(limit))
    }

    const { data: transactions, error } = await query

    if (error) {
      console.error('Error fetching transactions:', error)
      return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
    }

    return NextResponse.json({ transactions })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/transactions - Create new transaction
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Ensure user profile exists
    try {
      await ensureUserProfile(user.id, user.email || '')
    } catch (error) {
      console.error('Failed to ensure user profile:', error)
      return NextResponse.json({ error: 'Failed to create user profile' }, { status: 500 })
    }

    // Parse and validate request body
    const body = await request.json()
    
    // Validate the transaction data
    const validation = validateTransactionData(body)
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: validation.errors 
        }, 
        { status: 400 }
      )
    }

    // Sanitize the data
    const sanitizedData = sanitizeTransactionData(body)
    
    // Prepare transaction data
    const transactionData: TransactionInsert = {
      user_id: user.id,
      amount: sanitizedData.amount,
      type: sanitizedData.type,
      category: sanitizedData.category,
      description: sanitizedData.description || null,
      date: sanitizedData.date,
      is_recurring: sanitizedData.is_recurring,
      recurring_parent_id: sanitizedData.recurring_parent_id || null,
    }

    // Insert transaction
    const { data: transaction, error } = await supabase
      .from('transactions')
      .insert(transactionData)
      .select()
      .single()

    if (error) {
      console.error('Error creating transaction:', error)
      return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 })
    }

    return NextResponse.json({ transaction }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}