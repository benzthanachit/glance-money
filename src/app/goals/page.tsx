'use client'

import { ResponsiveLayout } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function GoalsPage() {
  return (
    <ResponsiveLayout currentPage="goals">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Goals</h1>
        <p className="text-muted-foreground">Track your financial goals</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Financial Goals</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Goals management functionality will be implemented in upcoming tasks.
          </p>
        </CardContent>
      </Card>
    </ResponsiveLayout>
  )
}