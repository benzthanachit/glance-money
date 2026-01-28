'use client';

import { useResponsive } from '@/lib/hooks/useResponsive';
import { BottomNavigation } from './bottom-navigation';
import { DesktopNavigation } from './desktop-navigation';
import { FloatingActionButton } from '../ui/floating-action-button';
import { cn } from '@/lib/utils';

export interface ResponsiveLayoutProps {
  children: React.ReactNode;
  currentPage: 'home' | 'transactions' | 'goals' | 'settings';
  onAddTransaction?: () => void;
  showFAB?: boolean;
}

export function ResponsiveLayout({
  children,
  currentPage,
  onAddTransaction,
  showFAB = false
}: ResponsiveLayoutProps) {
  const { isMobile } = useResponsive();

  const handleFABClick = () => {
    if (onAddTransaction) {
      onAddTransaction();
    } else {
      // Default behavior - could navigate to transaction form
      console.log('Add transaction clicked - no handler provided');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Navigation - Hidden on mobile */}
      <div className="hidden md:block">
        <DesktopNavigation currentPage={currentPage} />
      </div>

      {/* Main Content Area */}
      <main
        className={cn(
          'min-h-screen',
          // Mobile: Full width with bottom padding for navigation
          'pb-20 md:pb-0',
          // Desktop: Left margin for sidebar
          'md:ml-64'
        )}
      >
        <div className="mx-auto max-w-7xl p-4 md:p-8">
          {children}
        </div>
      </main>

      {/* Floating Action Button */}
      {showFAB && (
        <FloatingActionButton
          onClick={handleFABClick}
          position="center-bottom"
          aria-label="Add new transaction"
        />
      )}

      {/* Mobile Bottom Navigation - Hidden on desktop */}
      <div className="md:hidden">
        <BottomNavigation currentPage={currentPage} />
      </div>
    </div>
  );
}