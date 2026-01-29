'use client';

import { useState } from 'react';
import { MonthSelector } from '@/components/cashflow/MonthSelector';
import { useCashflowData } from '@/lib/hooks/useCashflowData';
import { CashflowSankey } from '@/components/cashflow/CashflowSankey';
import { CashflowTable } from '@/components/cashflow/CashflowTable';
import { Skeleton } from '@/components/ui/skeleton';
import { ResponsiveLayout } from '@/components/layout/responsive-layout';
import { ProtectedRoute } from '@/components/auth/protected-route';

export default function CashflowPage() {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const { data, isLoading } = useCashflowData(currentMonth);

    return (
        <ProtectedRoute>
            <ResponsiveLayout currentPage="cashflow" showFAB={true}>
                <div className="space-y-6 pb-24 md:pb-4">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <h1 className="text-2xl font-bold">Cashflow</h1>
                        <MonthSelector
                            currentMonth={currentMonth}
                            onMonthChange={setCurrentMonth}
                        />
                    </div>

                    {isLoading ? (
                        <div className="space-y-6">
                            <Skeleton className="h-[400px] w-full" />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Skeleton className="h-[300px]" />
                                <Skeleton className="h-[300px]" />
                            </div>
                        </div>
                    ) : data ? (
                        <>
                            <CashflowSankey data={data.sankeyData} />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <CashflowTable
                                    title="Income Sources"
                                    data={data.income}
                                    total={data.totalIncome}
                                    type="income"
                                />
                                <CashflowTable
                                    title="Expense Categories"
                                    data={data.expenses}
                                    total={data.totalExpense}
                                    type="expense"
                                />
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-10">
                            <p className="text-muted-foreground">No data available for this month.</p>
                        </div>
                    )}
                </div>
            </ResponsiveLayout>
        </ProtectedRoute>
    );
}
