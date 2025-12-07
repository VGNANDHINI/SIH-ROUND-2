
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2, RefreshCw } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';
import {
  ChartContainer,
  ChartTooltipContent,
  ChartTooltip,
} from '@/components/ui/chart';
import type { ChartConfig } from '@/components/ui/chart';
import { useCollection } from '@/firebase/firestore/use-collection';
import type { WaterTank } from '@/lib/data';
import { formatDistanceToNow } from 'date-fns';

const tankLevelData = [
  { time: '00:00', level: 45 }, { time: '01:00', level: 42 },
  { time: '02:00', level: 40 }, { time: '03:00', level: 38 },
  { time: '04:00', level: 35 }, { time: '05:00', level: 33 },
  { time: '06:00', level: 60 }, { time: '07:00', level: 85 },
  { time: '08:00', level: 90 }, { time: '09:00', level: 80 },
  { time: '10:00', level: 75 }, { time: '11:00', level: 70 },
  { time: '12:00', level: 65 }, { time: '13:00', level: 60 },
  { time: '14:00', level: 58 }, { time: '15:00', level: 55 },
  { time: '16:00', level: 52 }, { time: '17:00', level: 75 },
  { time: '18:00', level: 88 }, { time: '19:00', level: 80 },
  { time: '20:00', level: 72 }, { time: '21:00', level: 65 },
  { time: '22:00', level: 60 }, { time: '23:00', level: 55 },
];

const chartConfig = {
  level: {
    label: 'Level (%)',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig;

export default function PumpOperatorTankLevelPage() {
  const { data: tanks, loading } = useCollection<WaterTank>('waterTanks');
  const [selectedTank, setSelectedTank] = useState<WaterTank | null>(null);

  const handleCardClick = (tank: WaterTank) => {
    setSelectedTank(tank);
  };
  
  const formatLastUpdated = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate();
    return formatDistanceToNow(date, { addSuffix: true });
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Tank Water Levels</CardTitle>
            <CardDescription>
              Live status of all water tanks and reservoirs. Click a tank to see its trend.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" disabled>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {loading ? (
                 <div className="col-span-full flex items-center justify-center h-24">
                    <Loader2 className="h-8 w-8 animate-spin" />
                 </div>
            ) : tanks && tanks.length > 0 ? (
                tanks.map(tank => (
                    <Card key={tank.id} onClick={() => handleCardClick(tank)} className="cursor-pointer hover:border-primary">
                        <CardHeader>
                        <CardTitle>{tank.name}</CardTitle>
                        <CardDescription>{tank.capacity / 1000}k Liters Capacity</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-bold">{tank.currentLevel}%</span>
                        </div>
                        <Progress value={tank.currentLevel} aria-label={`${tank.currentLevel}% full`} />
                        <p className="text-xs text-muted-foreground">
                            {formatLastUpdated(tank.lastUpdated)}
                        </p>
                        </CardContent>
                    </Card>
                ))
            ) : (
                <p className="col-span-full text-center text-muted-foreground py-10">No tank data available. Complete a pump session to log tank levels.</p>
            )}
        </CardContent>
      </Card>
      
      {selectedTank && (
        <Card>
            <CardHeader>
            <CardTitle>{selectedTank.name} Level Trend (Last 24h)</CardTitle>
            <CardDescription>
                Hourly water level fluctuations in this tank.
            </CardDescription>
            </CardHeader>
            <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                <LineChart
                    data={tankLevelData}
                    margin={{
                    top: 5,
                    right: 20,
                    left: -10,
                    bottom: 5,
                    }}
                >
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis
                    dataKey="time"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                    tickFormatter={(value, index) => (index % 4 === 0 ? value : '')}
                    />
                    <YAxis
                    domain={[0, 100]}
                    unit="%"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                    />
                    <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent />}
                    />
                    <Line
                    type="monotone"
                    dataKey="level"
                    stroke="var(--color-level)"
                    strokeWidth={2}
                    dot={false}
                    />
                </LineChart>
                </ResponsiveContainer>
            </ChartContainer>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
