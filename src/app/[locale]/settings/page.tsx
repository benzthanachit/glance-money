'use client'

import { ResponsiveLayout } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function SettingsPage() {
  return (
    <ResponsiveLayout currentPage="settings">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Customize your app preferences</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>App Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Settings functionality will be implemented in upcoming tasks.
          </p>
        </CardContent>
      </Card>
    </ResponsiveLayout>
  )
}