
'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wrench, Clock, Droplets, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import type { Complaint, PumpLog, WaterTest } from '@/lib/data';

interface KpiCardsProps {
    complaints: Complaint[] | null;
    pumpLogs: PumpLog[] | null;
    waterTests: WaterTest[] | null;
    loading: boolean;
}

const calculateAverageRepairTime = (complaints: Complaint[]) => {
    const resolvedComplaints = complaints.filter(c => c.taskStartedAt && c.taskCompletedAt);
    if (resolvedComplaints.length === 0) return 0;

    const totalDuration = resolvedComplaints.reduce((acc, c) => {
        const startTime = c.taskStartedAt.seconds ? c.taskStartedAt.seconds * 1000 : new Date(c.taskStartedAt).getTime();
        const endTime = c.taskCompletedAt.seconds ? c.taskCompletedAt.seconds * 1000 : new Date(c.taskCompletedAt).getTime();
        return acc + (endTime - startTime);
    }, 0);

    return (totalDuration / resolvedComplaints.length) / (1000 * 60 * 60); // in hours
};

export function KpiCards({ complaints, pumpLogs, waterTests, loading }: KpiCardsProps) {
    const totalIncidents = complaints?.length ?? 0;
    const avgRepairTime = complaints ? calculateAverageRepairTime(complaints) : 0;
    const totalWaterSupplied = pumpLogs?.reduce((acc, log) => acc + (log.waterSupplied || 0), 0) ?? 0;
    const waterQualityCompliance = waterTests ? (waterTests.filter(t => t.status === 'safe').length / waterTests.length) * 100 : 0;

    const kpis = [
        { title: 'Total Repair Incidents', value: totalIncidents, unit: 'incidents', icon: <Wrench /> },
        { title: 'Avg. Repair Time', value: avgRepairTime.toFixed(1), unit: 'hours', icon: <Clock /> },
        { title: 'Total Water Supplied (kL)', value: (totalWaterSupplied / 1000).toLocaleString(undefined, { maximumFractionDigits: 0 }), unit: 'kL', icon: <Droplets /> },
        { title: 'Water Quality Compliance', value: `${waterQualityCompliance.toFixed(0)}%`, unit: '', icon: waterQualityCompliance > 90 ? <CheckCircle className="text-green-500" /> : <AlertCircle className="text-yellow-500" /> },
    ];
    
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {kpis.map((kpi, index) => (
                <Card key={index}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
                        <div className="h-4 w-4 text-muted-foreground">{kpi.icon}</div>
                    </CardHeader>
                    <CardContent>
                        {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : (
                            <>
                                <div className="text-2xl font-bold">{kpi.value}</div>
                                <p className="text-xs text-muted-foreground">{kpi.unit}</p>
                            </>
                        )}
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
