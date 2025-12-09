
'use client';

import { useMemo, useState, useEffect } from 'react';
import { useLeakageAlerts } from '@/firebase';
import type { LeakageAlert } from '@/lib/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertTriangle, ShieldAlert, CheckCircle } from 'lucide-react';

const getAlertInfo = (alert: LeakageAlert) => {
    const message = alert.Leakage_Alerts;
    if (message.includes('Confirmed Leakage')) {
        return { variant: 'destructive' as const, icon: <AlertTriangle className="h-4 w-4" />, label: 'Leakage Confirmed' };
    }
    if (message.includes('Pipeline Burst')) {
        return { variant: 'destructive' as const, icon: <ShieldAlert className="h-4 w-4" />, label: 'Burst Detected' };
    }
    if (message.includes('Possible Leakage')) {
        return { variant: 'secondary' as const, icon: <ShieldAlert className="h-4 w-4 text-yellow-500" />, label: 'Possible Leak' };
    }
    return { variant: 'success' as const, icon: <CheckCircle className="h-4 w-4" />, label: 'Normal' };
};

export default function LeakageDetectorPage() {
  const { data: alerts, loading } = useLeakageAlerts();

  const sortedAlerts = useMemo(() => {
    if (!alerts) return [];
    return alerts.sort((a, b) => {
        const timeA = a.Timestamp?.seconds ? a.Timestamp.seconds : new Date(a.Timestamp).getTime() / 1000;
        const timeB = b.Timestamp?.seconds ? b.Timestamp.seconds : new Date(b.Timestamp).getTime() / 1000;
        return timeB - timeA;
    });
  }, [alerts]);
  
  const alertCounts = useMemo(() => {
    if (!alerts) return [];
    
    const counts = alerts.reduce((acc, alert) => {
        const message = alert.Leakage_Alerts;
        acc[message] = (acc[message] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts).sort(([, countA], [, countB]) => countB - countA);

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
      
       <Card>
        <CardHeader>
            <CardTitle>Analysis Counter</CardTitle>
            <CardDescription>A summary of all alerts received from the sensor network.</CardDescription>
        </CardHeader>
        <CardContent>
           {loading ? <div className="flex justify-center items-center h-24"><Loader2 className="h-8 w-8 animate-spin" /></div> : (
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Alert Type</TableHead>
                        <TableHead className="text-right">Total Count</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {alertCounts.map(([message, count]) => (
                         <TableRow key={message}>
                            <TableCell className="font-medium">{message}</TableCell>
                            <TableCell className="text-right text-lg font-bold">{count}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
           )}
        </CardContent>
      </Card>

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
                  <TableHead className="text-right">Pressure (bar)</TableHead>
                  <TableHead className="text-right">Flow (L/s)</TableHead>
                  <TableHead className="text-right">Temp (°C)</TableHead>
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
                        <TableCell className="text-right font-mono">{typeof alert['Pressure (bar)'] === 'number' ? alert['Pressure (bar)'].toFixed(3) : 'N/A'}</TableCell>
                        <TableCell className="text-right font-mono">{typeof alert['Flow Rate (L/s)'] === 'number' ? alert['Flow Rate (L/s)'].toFixed(3) : 'N/A'}</TableCell>
                        <TableCell className="text-right font-mono">{typeof alert['Temperature (°C)'] === 'number' ? alert['Temperature (°C)'].toFixed(3) : 'N/A'}</TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
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
