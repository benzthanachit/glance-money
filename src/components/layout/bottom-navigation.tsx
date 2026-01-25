'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { TOUCH_TARGET_MIN_HEIGHT } from '@/lib/constants';
import { 
  Home, 
  CreditCard, 
  Target, 
  Settings 
} from 'lucide-react';

export interface BottomNavigationProps {
  currentPage: 'home' | 'transactions' | 'goals' | 'settings';
}

const navigationItems = [
  {
    id: 'home' as const,
    label: 'Home',
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

export function BottomNavigation({ currentPage }: BottomNavigationProps) {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-around px-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id || pathname === item.href;
          
          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 px-3 py-2 text-xs transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                // Ensure minimum touch target height
                `min-h-[${TOUCH_TARGET_MIN_HEIGHT}px]`,
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              style={{ minHeight: `${TOUCH_TARGET_MIN_HEIGHT}px` }}
            >
              <Icon 
                className={cn(
                  'h-5 w-5',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )} 
              />
              <span className={cn(
                'font-medium',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}