"use client"

import { Bar, BarChart, CartesianGrid, Pie, PieChart, ResponsiveContainer, XAxis, YAxis, Line, LineChart } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart"
import { analyticsData } from "@/lib/data"
import type { ChartConfig } from "@/components/ui/chart"

const waterConsumptionConfig = {
  consumption: {
    label: "Consumption (kL)",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig

const issueStatusConfig = {
  open: { label: 'Open', color: 'hsl(var(--destructive))' },
  progress: { label: 'In Progress', color: 'hsl(var(--secondary-foreground))' },
  resolved: { label: 'Resolved', color: 'hsl(var(--accent))' },
} satisfies ChartConfig

const schemeCoverageConfig = {
    coverage: {
        label: "Coverage %",
        color: "hsl(var(--primary))",
    }
} satisfies ChartConfig

export function AnalyticsCharts() {
  return (
    <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Regional Water Consumption</CardTitle>
            <CardDescription>Last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={waterConsumptionConfig} className="h-[250px] w-full">
              <BarChart accessibilityLayer data={analyticsData.waterConsumption}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                />
                <YAxis />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" />}
                />
                <Bar dataKey="consumption" fill="var(--color-consumption)" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pump Issue Status</CardTitle>
            <CardDescription>Current open, in-progress, and resolved issues.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <ChartContainer config={issueStatusConfig} className="h-[250px] w-full">
              <PieChart>
                 <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Pie data={analyticsData.issueStatus} dataKey="value" nameKey="name" innerRadius={60} />
                <ChartLegend
                    content={<ChartLegendContent nameKey="name" />}
                />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
        
        <Card className="lg:col-span-2 xl:col-span-1">
          <CardHeader>
            <CardTitle>Scheme Coverage by Village</CardTitle>
            <CardDescription>Percentage of households covered by water schemes.</CardDescription>
          </CardHeader>
          <CardContent>
             <ChartContainer config={schemeCoverageConfig} className="h-[250px] w-full">
                <LineChart
                    data={analyticsData.schemeCoverage}
                    margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={10} angle={-30} textAnchor="end" height={50} />
                    <YAxis domain={[0, 100]} unit="%"/>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="coverage" stroke="var(--color-coverage)" strokeWidth={2} />
                </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
    </div>
  )
}
