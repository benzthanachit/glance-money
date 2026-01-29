'use client';

import * as React from 'react';
import { format, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MonthSelectorProps {
    currentMonth: Date;
    onMonthChange: (date: Date) => void;
}

export function MonthSelector({ currentMonth, onMonthChange }: MonthSelectorProps) {

    const handlePreviousMonth = () => {
        onMonthChange(subMonths(currentMonth, 1));
    };

    const handleNextMonth = () => {
        onMonthChange(addMonths(currentMonth, 1));
    };

    return (
        <div className="flex items-center gap-2">
            <Button
                variant="outline"
                size="icon"
                onClick={handlePreviousMonth}
                aria-label="Previous month"
            >
                <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="w-[180px] text-center font-medium">
                {format(currentMonth, 'MMMM yyyy')}
            </div>

            <Button
                variant="outline"
                size="icon"
                onClick={handleNextMonth}
                aria-label="Next month"
            >
                <ChevronRight className="h-4 w-4" />
            </Button>
        </div>
    );
}
