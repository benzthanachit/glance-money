import { useState, useEffect } from 'react';
import { transactionService } from '@/lib/services/transactionService';
import { Transaction } from '@/lib/types/database';
import { startOfMonth, endOfMonth, format } from 'date-fns';

export interface CashflowData {
    income: { category: string; amount: number }[];
    expenses: { category: string; amount: number }[];
    totalIncome: number;
    totalExpense: number;
    netFlow: number;
    sankeyData: {
        nodes: { name: string }[];
        links: { source: number; target: number; value: number }[];
    };
}

export function useCashflowData(date: Date) {
    const [data, setData] = useState<CashflowData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            try {
                setIsLoading(true);
                const startDate = format(startOfMonth(date), 'yyyy-MM-dd');
                const endDate = format(endOfMonth(date), 'yyyy-MM-dd');

                const transactions = await transactionService.getTransactions({
                    startDate,
                    endDate,
                });

                // Process data
                const incomeMap = new Map<string, number>();
                const expenseMap = new Map<string, number>();
                let totalIncome = 0;
                let totalExpense = 0;

                transactions.forEach((t) => {
                    const amount = Number(t.amount);
                    if (t.type === 'income') {
                        incomeMap.set(t.category, (incomeMap.get(t.category) || 0) + amount);
                        totalIncome += amount;
                    } else if (t.type === 'expense') {
                        expenseMap.set(t.category, (expenseMap.get(t.category) || 0) + amount);
                        totalExpense += amount;
                    }
                });

                const income = Array.from(incomeMap.entries()).map(([category, amount]) => ({
                    category,
                    amount,
                }));
                const expenses = Array.from(expenseMap.entries()).map(([category, amount]) => ({
                    category,
                    amount,
                }));

                // Construct Sankey Data
                // Nodes: Income Categories..., "Cashflow", Expense Categories...
                // Indices: 
                // 0 to N-1: Income Categories
                // N: Cashflow (Center)
                // N+1 to N+M: Expense Categories

                const nodes: { name: string }[] = [];
                const links: { source: number; target: number; value: number }[] = [];

                // Add Income Nodes
                income.forEach((inc) => {
                    nodes.push({ name: inc.category });
                });

                // Add Cashflow Node (Center)
                const centerNodeIndex = nodes.length;
                nodes.push({ name: 'Cashflow' });

                // Add Expense Nodes
                const expensestartIndex = nodes.length;
                expenses.forEach((exp) => {
                    nodes.push({ name: exp.category });
                });

                // Create Links: Income -> Cashflow
                income.forEach((inc, index) => {
                    links.push({
                        source: index,
                        target: centerNodeIndex,
                        value: inc.amount,
                    });
                });

                // Create Links: Cashflow -> Expense
                expenses.forEach((exp, index) => {
                    links.push({
                        source: centerNodeIndex,
                        target: expensestartIndex + index,
                        value: exp.amount,
                    });
                });

                // Handle Surplus (Net Flow positive) or Deficit?
                // Usually Sankey needs balanced flow or just shows what went out.
                // If Income > Expense, the remaining stays in "Cashflow" or goes to "Savings" (implicit).
                // For visual completeness, we might verify this logic later. 
                // For now, let's just map Income -> Cashflow -> Expenses.

                setData({
                    income,
                    expenses,
                    totalIncome,
                    totalExpense,
                    netFlow: totalIncome - totalExpense,
                    sankeyData: { nodes, links },
                });
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch cashflow data');
            } finally {
                setIsLoading(false);
            }
        }

        fetchData();
    }, [date]);

    return { data, isLoading, error };
}
