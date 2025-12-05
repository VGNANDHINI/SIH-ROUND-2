'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Droplets, Zap, Loader2 } from 'lucide-react';
import type { PumpLog } from '@/lib/data';
import { useMemo } from 'react';

function getTodayStart() {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
}

export function DailyStats({ logs }: { logs: PumpLog[] | null }) {
    const dailyStats = useMemo(() => {
        if (!logs) return { hours: 0, water: 0, energy: 0 };
        
        const todayStart = getTodayStart();
        const todayLogs = logs.filter(log => {
            if (log.endTime?.seconds) {
                return log.endTime.seconds * 1000 >= todayStart.getTime();
            }
            return false;
        });

        const totalDuration = todayLogs.reduce((acc, log) => acc + (log.duration || 0), 0);
        const totalWater = todayLogs.reduce((acc, log) => acc + (log.waterSupplied || 0), 0);
        const totalEnergy = todayLogs.reduce((acc, log) => acc + (log.energyConsumed || 0), 0);

        return {
            hours: (totalDuration / 3600).toFixed(2),
            water: (totalWater / 1000).toFixed(2), // convert to kL
            energy: totalEnergy.toFixed(2),
        };
    }, [logs]);

    return (
        <div className="grid gap-4 md:grid-cols-3">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Running Hours (Today)</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {!logs ? <Loader2 className="h-6 w-6 animate-spin"/> : (
                        <>
                            <div className="text-2xl font-bold">{dailyStats.hours} hrs</div>
                            <p className="text-xs text-muted-foreground">Total pump running time</p>
                        </>
                    )}
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Water Produced (Today)</CardTitle>
                    <Droplets className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {!logs ? <Loader2 className="h-6 w-6 animate-spin"/> : (
                        <>
                            <div className="text-2xl font-bold">{dailyStats.water} kL</div>
                            <p className="text-xs text-muted-foreground">Kilo-liters supplied</p>
                        </>
                    )}
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Energy Used (Today)</CardTitle>
                    <Zap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {!logs ? <Loader2 className="h-6 w-6 animate-spin"/> : (
                        <>
                            <div className="text-2xl font-bold">{dailyStats.energy} kWh</div>
                            <p className="text-xs text-muted-foreground">Kilowatt-hours consumed</p>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
