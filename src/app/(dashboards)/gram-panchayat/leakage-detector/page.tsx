
'use client';

import { useMemo } from 'react';
import { useLeakageAlerts } from '@/firebase';
import type { LeakageAlert } from '@/lib/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertTriangle, ShieldAlert, CheckCircle, Signal, Thermometer, Droplets, Gauge } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const getAlertInfo = (alert: LeakageAlert) => {
    const message = alert.Leakage_Alerts;
    if (message.includes('Confirmed Leakage')) {
        return { variant: 'destructive', icon: <AlertTriangle className="h-4 w-4" />, label: 'Leakage Confirmed' };
    }
    if (message.includes('Pipeline Burst')) {
        return { variant: 'destructive', icon: <ShieldAlert className="h-4 w-4" />, label: 'Burst Detected' };
    }
    if (message.includes('Possible Leakage')) {
        return { variant: 'secondary', icon: <ShieldAlert className="h-4 w-4 text-yellow-500" />, label: 'Possible Leak' };
    }
    return { variant: 'success', icon: <CheckCircle className="h-4 w-4" />, label: 'Normal' };
};

const KpiCard = ({ title, value, icon, loading }: { title: string, value: number, icon: React.ReactNode, loading: boolean }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            {icon}
        </CardHeader>
        <CardContent>
            {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <div className="text-2xl font-bold">{value}</div>}
        </CardContent>
    </Card>
);

export default function LeakageDetectorPage() {
  const { data: alerts, loading } = useLeakageAlerts();

  const sortedAlerts = useMemo(() => {
    if (!alerts) return [];
    // Ensure Timestamp is a comparable value (Date object)
    return alerts.sort((a, b) => {
        const timeA = a.Timestamp?.seconds ? a.Timestamp.seconds : new Date(a.Timestamp).getTime() / 1000;
        const timeB = b.Timestamp?.seconds ? b.Timestamp.seconds : new Date(b.Timestamp).getTime() / 1000;
        return timeB - timeA;
    });
  }, [alerts]);

  const stats = useMemo(() => {
    if (!alerts) return { leakages: 0, bursts: 0, warnings: 0, normal: 0 };
    return {
      leakages: alerts.filter(a => a.Leakage_Alerts.includes('Confirmed Leakage')).length,
      bursts: alerts.filter(a => a.Burst_Status === 1).length,
      warnings: alerts.filter(a => a.Leakage_Alerts.includes('Possible Leakage')).length,
      normal: alerts.filter(a => a.Leakage_Alerts.includes('No leakage')).length,
    };
  }, [alerts]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Online Water Leakage Detector</CardTitle>
          <CardDescription>
            Live feed from the sensor network, processed by the Google Colab analysis pipeline.
          </CardDescription>
        </CardHeader>
      </Card>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <KpiCard title="Leakages Detected" value={stats.leakages} icon={<AlertTriangle className="h-4 w-4 text-muted-foreground" />} loading={loading} />
          <KpiCard title="Pipeline Bursts" value={stats.bursts} icon={<ShieldAlert className="h-4 w-4 text-muted-foreground" />} loading={loading} />
          <KpiCard title="Low-Pressure Warnings" value={stats.warnings} icon={<Signal className="h-4 w-4 text-muted-foreground" />} loading={loading} />
          <KpiCard title="Normal Readings" value={stats.normal} icon={<CheckCircle className="h-4 w-4 text-muted-foreground" />} loading={loading} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Live Sensor Alerts</CardTitle>
          <CardDescription>This table automatically updates with the latest data from Firestore.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading && !alerts ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Sensor ID</TableHead>
                  <TableHead>Alert</TableHead>
                  <TableHead className="text-right">Readings</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedAlerts.length > 0 ? (
                  sortedAlerts.map(alert => {
                    const alertInfo = getAlertInfo(alert);
                    return (
                      <TableRow key={alert.id}>
                        <TableCell>{alert.Timestamp?.seconds ? new Date(alert.Timestamp.seconds * 1000).toLocaleString() : new Date(alert.Timestamp).toLocaleString()}</TableCell>
                        <TableCell className="font-medium">{alert.Sensor_ID}</TableCell>
                        <TableCell>
                          <Badge variant={alertInfo.variant}>
                            {alertInfo.icon}
                            <span className="ml-2">{alert.Leakage_Alerts}</span>
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center justify-end gap-3 text-muted-foreground">
                                  <Gauge className="h-4 w-4" /><span>{typeof alert.Pressure === 'number' ? `${alert.Pressure.toFixed(2)} bar` : 'N/A'}</span>
                                  <Droplets className="h-4 w-4" /><span>{typeof alert.Flow_Rate === 'number' ? `${alert.Flow_Rate.toFixed(2)} L/s` : 'N/A'}</span>
                                  <Thermometer className="h-4 w-4" /><span>{typeof alert.Temperature === 'number' ? `${alert.Temperature.toFixed(2)}°C` : 'N/A'}</span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Pressure: {typeof alert.Pressure === 'number' ? `${alert.Pressure.toFixed(2)} bar` : 'N/A'}</p>
                                <p>Flow Rate: {typeof alert.Flow_Rate === 'number' ? `${alert.Flow_Rate.toFixed(2)} L/s` : 'N/A'}</p>
                                <p>Temperature: {typeof alert.Temperature === 'number' ? `${alert.Temperature.toFixed(2)}°C` : 'N/A'}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      No sensor data available. Waiting for data from Colab...
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

