'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils/formatting";
import { useLocale } from "@/lib/contexts/language-context";

interface CashflowTableProps {
    title: string;
    data: { category: string; amount: number }[];
    total: number;
    type: 'income' | 'expense';
}

export function CashflowTable({ title, data, total, type }: CashflowTableProps) {
    const locale = useLocale();
    // Sort data by amount descending
    const sortedData = [...data].sort((a, b) => b.amount - a.amount);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg font-semibold">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="w-full overflow-auto">
                    <table className="w-full caption-bottom text-sm">
                        <thead className="[&_tr]:border-b">
                            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">
                                    Category
                                </th>
                                <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">
                                    Amount
                                </th>
                                <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">
                                    %
                                </th>
                            </tr>
                        </thead>
                        <tbody className="[&_tr:last-child]:border-0">
                            {sortedData.map((item) => (
                                <tr
                                    key={item.category}
                                    className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                                >
                                    <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0 font-medium">
                                        {item.category}
                                    </td>
                                    <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0 text-right">
                                        {formatCurrency({ amount: item.amount, currency: 'THB', locale })}
                                    </td>
                                    <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0 text-right text-muted-foreground">
                                        {total > 0 ? ((item.amount / total) * 100).toFixed(1) : 0}%
                                    </td>
                                </tr>
                            ))}
                            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted font-bold">
                                <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0">Total</td>
                                <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0 text-right">
                                    {formatCurrency({ amount: total, currency: 'THB', locale })}
                                </td>
                                <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0 text-right">100%</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}
