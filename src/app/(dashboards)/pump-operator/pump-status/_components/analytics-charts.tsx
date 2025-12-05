'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';

const chartData = [
  { day: "Yesterday", kwh: 12.5, water: 85 },
  { day: "Today", kwh: 14.2, water: 92 },
]

const chartConfig = {
  kwh: {
    label: "kWh",
    color: "hsl(var(--chart-1))",
  },
  water: {
    label: "Water (kL)",
    color: "hsl(var(--chart-2))",
  }
}

export function AnalyticsCharts() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Today vs. Yesterday</CardTitle>
                <CardDescription>Energy consumption and water production comparison.</CardDescription>
            </CardHeader>
            <CardContent>
                 <ChartContainer config={chartConfig} className="h-[250px] w-full">
                    <BarChart accessibilityLayer data={chartData}>
                        <CartesianGrid vertical={false} />
                        <XAxis dataKey="day" tickLine={false} tickMargin={10} axisLine={false} />
                        <YAxis yAxisId="left" orientation="left" stroke="var(--color-kwh)" />
                        <YAxis yAxisId="right" orientation="right" stroke="var(--color-water)" />
                        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                        <Bar yAxisId="left" dataKey="kwh" fill="var(--color-kwh)" radius={4} />
                        <Bar yAxisId="right" dataKey="water" fill="var(--color-water)" radius={4} />
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}
