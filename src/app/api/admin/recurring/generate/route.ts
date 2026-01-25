import { NextRequest, NextResponse } from 'next/server'
import { recurringScheduler } from '@/lib/utils/recurring-scheduler'

// POST /api/admin/recurring/generate - Generate recurring transactions for all users
// This endpoint would typically be called by a cron job or scheduled task
export async function POST(request: NextRequest) {
  try {
    // In a production environment, you'd want to add authentication/authorization here
    // For example, check for an API key or admin token
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.ADMIN_API_TOKEN
    
    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await recurringScheduler.generateAllRecurringTransactions()

    return NextResponse.json({
      success: true,
      message: `Generated ${result.totalGenerated} recurring transactions for ${result.userCount} users`,
      ...result
    })
  } catch (error) {
    console.error('Error in recurring transaction generation:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate recurring transactions' 
      }, 
      { status: 500 }
    )
  }
}

// GET /api/admin/recurring/generate - Get recurring transaction statistics
export async function GET(request: NextRequest) {
  try {
    // In a production environment, you'd want to add authentication/authorization here
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.ADMIN_API_TOKEN
    
    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const stats = await recurringScheduler.getRecurringTransactionStats()

    return NextResponse.json({
      success: true,
      stats
    })
  } catch (error) {
    console.error('Error fetching recurring transaction stats:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch stats' 
      }, 
      { status: 500 }
    )
  }
}