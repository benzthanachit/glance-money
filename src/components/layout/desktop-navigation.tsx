'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth/context';
import { Button } from '@/components/ui/button';
import { 
  Home, 
  CreditCard, 
  Target, 
  Settings,
  LogOut,
  Wallet
} from 'lucide-react';

export interface DesktopNavigationProps {
  currentPage: 'home' | 'transactions' | 'goals' | 'settings';
}

const navigationItems = [
  {
    id: 'home' as const,
    label: 'Dashboard',
    href: '/dashboard',
    icon: Home,
  },
  {
    id: 'transactions' as const,
    label: 'Transactions',
    href: '/transactions',
    icon: CreditCard,
  },
  {
    id: 'goals' as const,
    label: 'Goals',
    href: '/goals',
    icon: Target,
  },
  {
    id: 'settings' as const,
    label: 'Settings',
    href: '/settings',
    icon: Settings,
  },
];

export function DesktopNavigation({ currentPage }: DesktopNavigationProps) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-background">
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-border p-6">
          <Wallet className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-xl font-bold text-foreground">Glance Money</h1>
            <p className="text-sm text-muted-foreground">Expense Tracker</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-2 p-4">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id || pathname === item.href;
            
            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors',
                  'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                  // Ensure minimum touch target height for desktop too
                  'min-h-[44px]',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User Info and Sign Out */}
        <div className="border-t border-border p-4">
          <div className="mb-3 rounded-lg bg-muted p-3">
            <p className="text-sm font-medium text-foreground">
              {user?.email}
            </p>
            <p className="text-xs text-muted-foreground">
              Signed in
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={signOut}
            className="w-full justify-start gap-2"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </aside>
  );
}