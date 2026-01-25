'use client';

import * as React from 'react';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { TOUCH_TARGET_MIN_HEIGHT } from '@/lib/constants';

export interface FloatingActionButtonProps {
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  position?: 'center-bottom' | 'bottom-right';
  className?: string;
  disabled?: boolean;
  'aria-label'?: string;
}

export function FloatingActionButton({
  onClick,
  variant = 'primary',
  position = 'center-bottom',
  className,
  disabled = false,
  'aria-label': ariaLabel = 'Add transaction',
  ...props
}: FloatingActionButtonProps) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cn(
        // Base FAB styles
        'fixed z-40 rounded-full shadow-lg transition-all duration-200',
        'hover:shadow-xl active:scale-95',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        
        // Size - ensure minimum touch target
        'h-14 w-14 p-0',
        `min-h-[${TOUCH_TARGET_MIN_HEIGHT}px]`,
        
        // Responsive positioning
        position === 'center-bottom' && [
          // Mobile: Center above bottom navigation
          'bottom-24 left-1/2 -translate-x-1/2',
          // Desktop: Bottom-right corner
          'md:bottom-8 md:left-auto md:right-8 md:translate-x-0',
        ],
        position === 'bottom-right' && [
          // Always bottom-right
          'bottom-8 right-8',
          // Adjust for mobile bottom navigation
          'md:bottom-8',
        ],
        
        // Variant styles
        variant === 'primary' && [
          'bg-primary text-primary-foreground',
          'hover:bg-primary/90',
          'border-2 border-primary',
        ],
        variant === 'secondary' && [
          'bg-secondary text-secondary-foreground',
          'hover:bg-secondary/80',
          'border-2 border-secondary',
        ],
        
        // Disabled state
        disabled && 'opacity-50 cursor-not-allowed hover:shadow-lg active:scale-100',
        
        className
      )}
      style={{ 
        minHeight: `${TOUCH_TARGET_MIN_HEIGHT}px`,
        minWidth: `${TOUCH_TARGET_MIN_HEIGHT}px`,
      }}
      {...props}
    >
      <Plus className="h-6 w-6" strokeWidth={2.5} />
    </Button>
  );
}