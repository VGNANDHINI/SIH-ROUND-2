'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart"
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts"
import type { ChartConfig } from "@/components/ui/chart"

const chartData = [
  { date: "2024-05-20", pump1: 85, pump2: 90, pump3: 78 },
  { date: "2024-05-21", pump1: 88, pump2: 92, pump3: 80 },
  { date: "2024-05-22", pump1: 90, pump2: 88, pump3: 85 },
  { date: "2024-05-23", pump1: 86, pump2: 91, pump3: 82 },
  { date: "2024-05-24", pump1: 92, pump2: 95, pump3: 88 },
  { date: "2024-05-25", pump1: 94, pump2: 93, pump3: 90 },
  { date: "2024-05-26", pump1: 91, pump2: 96, pump3: 89 },
];

const chartConfig = {
  pump1: {
    label: "PMP-RG-01",
    color: "hsl(var(--chart-1))",
  },
  pump2: {
    label: "PMP-SP-03",
    color: "hsl(var(--chart-2))",
  },
  pump3: {
    label: "PMP-LG-02",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig

export function WeeklyAnalytics() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>7-Day Performance: Water Produced</CardTitle>
        <CardDescription>Comparison of water produced (kL) across different pumps.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
            />
             <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                unit=" kL"
             />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Line
              dataKey="pump1"
              type="monotone"
              stroke="var(--color-pump1)"
              strokeWidth={2}
              dot={false}
            />
            <Line
              dataKey="pump2"
              type="monotone"
              stroke="var(--color-pump2)"
              strokeWidth={2}
              dot={false}
            />
             <Line
              dataKey="pump3"
              type="monotone"
              stroke="var(--color-pump3)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
