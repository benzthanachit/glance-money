'use client';

import { ResponsiveContainer, Sankey, Tooltip, Rectangle, Label } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTheme } from 'next-themes';

interface CashflowSankeyProps {
    data: {
        nodes: { name: string }[];
        links: { source: number; target: number; value: number }[];
    };
}

// Custom color palette
const COLORS = [
    '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#a855f7', '#ec4899', '#6366f1', '#14b8a6', '#f43f5e', '#8b5cf6'
];

// Helper to determine color based on node index or name
const getNodeColor = (index: number, name: string) => {
    if (name === 'Cashflow') return '#8884d8'; // Central node color
    return COLORS[index % COLORS.length];
};

const CustomNode = ({ x, y, width, height, index, payload, containerWidth }: any) => {
    const isOut = x + width + 6 > containerWidth;
    const color = getNodeColor(index, payload.name);

    // Calculate percentage if possible (requires total context or we assume node.value is helpful)
    // Recharts Sankey nodes usually have `value` (sum of links).
    // We can calculate % if we know the total. 
    // For simplicity, let's just show value or we need to pass total in props?
    // Actually, payload.value is the flow through this node.
    // We can check if it's an Income or Expense node by position or just show raw value/name?
    // The user asked for %. "Cashflow" node usually equals Total Income (or Net).
    // If we assume "Cashflow" node value is the denominator for everyone else?

    // Actually, to get %, we need the total. 
    // Let's assume the largest node (Cashflow) is 100% or close to it?

    // Better approach: Pass totalIncome/TotalExpense in data?
    // For now, let's try to just render the node with name and let Tooltip show value.
    // Wait, user specifically asked for "% with label".

    return (
        <g>
            <Rectangle
                x={x}
                y={y}
                width={width}
                height={height}
                fill={color}
                fillOpacity={0.9}
            />
            <text
                x={x + width / 2}
                y={y + height / 2}
                textAnchor="middle"
                alignmentBaseline="middle"
                fill="#fff"
                fontSize="12"
                fontWeight="bold"
                style={{ pointerEvents: 'none', textShadow: '0px 0px 3px rgba(0,0,0,0.5)' }}
            >
                {/* Show only first few chars inside or nothing if too small */}
                {/* {payload.name.substring(0, 3)} */}
            </text>

            {/* External Label */}
            <text
                x={isOut ? x - 6 : x + width + 6}
                y={y + height / 2}
                textAnchor={isOut ? 'end' : 'start'}
                alignmentBaseline="middle"
                fill="#000" // Should detect theme
                className="fill-foreground text-xs"
                fontSize="12"
            >
                {payload.name}
            </text>
        </g>
    );
};


export function CashflowSankey({ data }: CashflowSankeyProps) {
    const { theme } = useTheme();

    if (!data || data.nodes.length === 0 || data.links.length === 0) {
        return (
            <Card className="h-[400px] flex items-center justify-center text-muted-foreground">
                No data available for diagram
            </Card>
        );
    }

    // Need to find the "Cashflow" node value to calculate percentages
    const cashflowNode = data.nodes.find(n => n.name === 'Cashflow');
    // Using a simple hack: total value of the system is approximately the max value of any single node (Cashflow node)
    // But data.nodes from Recharts *before* render doesn't have `value`.
    // We only pass `name`. Recharts calculates `value` during render.

    // So we can't easily pass % to CustomNode prop unless we pre-calculate in `useCashflowData`.
    // AND data.nodes in props is just { name: string }. 

    // Let's modify CustomNode to receive the calculated value from Recharts (it passes `payload.value`).
    // We still need the "Total" to calculate %.
    // We can pass `totalFlow` as a prop to CashflowSankey? 
    // Or just find the max value among links?

    // Actually, `useCashflowData` calculates `totalIncome`. We can use that.

    return (
        <Card className="h-[500px]">
            <CardHeader>
                <CardTitle>Money Flow</CardTitle>
            </CardHeader>
            <CardContent className="h-[420px]">
                <ResponsiveContainer width="100%" height="100%">
                    <Sankey
                        data={data}
                        node={<CustomNodeWithPercentage totalValue={data.links.reduce((acc, link) => link.target === data.nodes.findIndex(n => n.name === 'Cashflow') ? acc + link.value : acc, 0)} />}
                        link={{ stroke: '#82ca9d' }}
                        margin={{ top: 20, right: 200, bottom: 20, left: 200 }} // Increase margin for labels
                    >
                        <Tooltip />
                    </Sankey>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}

// Wrapper to pass totalValue to CustomNode
const CustomNodeWithPercentage = (props: any) => {
    const { x, y, width, height, index, payload, containerWidth, totalValue } = props;
    const isOut = x + width + 6 > containerWidth;
    const color = getNodeColor(index, payload.name);

    // payload.value is properly populated by Recharts Sankey
    const percent = totalValue > 0 ? (payload.value / totalValue) * 100 : 0;

    // For Income/Expense nodes, this % makes sense relative to Total Income (Cashflow node).
    // Note: If Net Flow is positive, Cashflow Node > Expense Sum.
    // If we use Cashflow Node Value as denominator:
    // Income Nodes sum = 100% (approx)
    // Expense Nodes sum = X% ( < 100% if savings, > 100% if debt/deficit?) 

    return (
        <g>
            <Rectangle
                x={x}
                y={y}
                width={width}
                height={height}
                fill={color}
                fillOpacity={0.9}
            />

            {/* Label outside */}
            <text
                x={isOut ? x - 6 : x + width + 6}
                y={y + height / 2}
                textAnchor={isOut ? 'end' : 'start'}
                alignmentBaseline="middle"
                className="fill-foreground text-xs font-medium"
                fontSize="12"
            >
                {payload.name} ({payload.value > 0 ? percent.toFixed(1) : 0}%)
            </text>
        </g>
    );
};
