'use client'

import { ResponsiveLayout } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function TransactionsPage() {
  return (
    <ResponsiveLayout currentPage="transactions">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Transactions</h1>
        <p className="text-muted-foreground">Manage your income and expenses</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transaction List</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Transaction management functionality will be implemented in upcoming tasks.
          </p>
        </CardContent>
      </Card>
    </ResponsiveLayout>
  )
}