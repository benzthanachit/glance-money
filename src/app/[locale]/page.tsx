import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useTranslations } from 'next-intl';
import Link from "next/link";

export default function Home() {
  const t = useTranslations('dashboard');
  const tCommon = useTranslations('common');

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background p-4 md:p-8">
        <main className="mx-auto max-w-4xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-foreground md:text-4xl">
              Glance Money
            </h1>
            <p className="mt-2 text-muted-foreground">
              The Simplest Expense Tracker in the World
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  📱 Mobile-First Design
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Optimized for mobile devices with responsive design that adapts to any screen size.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  ⚡ PWA Ready
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Install as a native app with offline capabilities and push notifications.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🎨 Dynamic Theming
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Visual financial status with green/red theming based on your net status.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🌐 Internationalization
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Support for Thai and English languages with proper currency formatting.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  📊 Real-time Sync
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Data synchronization across all your devices with Supabase backend.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🎯 Goal Tracking
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Set and track financial goals with progress visualization.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 text-center">
            <Button size="lg" className="min-h-[44px]" asChild>
              <Link href="/dashboard">
                Get Started
              </Link>
            </Button>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}