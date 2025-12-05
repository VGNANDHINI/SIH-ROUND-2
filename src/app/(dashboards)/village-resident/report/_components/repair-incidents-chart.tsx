
'use client';
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import type { Complaint } from '@/lib/data';
import { useMemo } from 'react';

const chartConfig = {
    incidents: {
        label: 'Incidents',
        color: 'hsl(var(--primary))',
    },
};

export function RepairIncidentsChart({ complaints }: { complaints: Complaint[] | null }) {
    const chartData = useMemo(() => {
        if (!complaints) return [];
        const incidentCounts = complaints.reduce((acc, complaint) => {
            const type = complaint.issueType;
            acc[type] = (acc[type] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(incidentCounts).map(([name, count]) => ({ name, incidents: count }));
    }, [complaints]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Repair Incidents by Type</CardTitle>
                <CardDescription>Breakdown of all reported issues.</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="h-64 w-full">
                    <BarChart data={chartData} accessibilityLayer>
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="name"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                            angle={-30}
                            textAnchor="end"
                            height={60}
                        />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="incidents" fill="var(--color-incidents)" radius={4} />
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}
