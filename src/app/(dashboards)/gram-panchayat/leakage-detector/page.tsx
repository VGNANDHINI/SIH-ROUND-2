
'use client';

import { useMemo, useState, useEffect } from 'react';
import { useLeakageAlerts } from '@/firebase';
import type { LeakageAlert } from '@/lib/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertTriangle, ShieldAlert, CheckCircle, Signal, Thermometer, Droplets, Gauge, Bot } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { diagnoseWaterNetwork, DiagnoseWaterNetworkOutput } from '@/ai/flows/diagnose-water-network';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';


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

export default function LeakageDetectorPage() {
  const { data: alerts, loading } = useLeakageAlerts();
  const [analysis, setAnalysis] = useState<DiagnoseWaterNetworkOutput | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  const sortedAlerts = useMemo(() => {
    if (!alerts) return [];
    // Ensure Timestamp is a comparable value (Date object)
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

  useEffect(() => {
    if(sortedAlerts && sortedAlerts.length > 0) {
        const latestAlert = sortedAlerts[0];
        if (latestAlert.Pressure === undefined || latestAlert.Flow_Rate === undefined) {
            // If the latest alert doesn't have pressure or flow, don't run analysis
            if(analysis) setAnalysis(null); // Clear old analysis
            return;
        }
        
        setAnalysisLoading(true);

        const leakComplaints = alerts.filter(a => a.Leak_Status == 1).length;

        diagnoseWaterNetwork({
            pressure_value: latestAlert.Pressure,
            flow_rate: latestAlert.Flow_Rate,
            chlorine_level: 0.5, // Dummy data, replace with real data if available
            turbidity_level: 1, // Dummy data
            reservoir_drop_rate: latestAlert.Leak_Status === 1 ? 500 : 50, // Dummy logic
            pump_status: 'running', // Dummy
            complaints_count: leakComplaints,
            complaint_types: leakComplaints > 0 ? ['low pressure', 'leakage'] : [],
            sewage_line_nearby: false, // Dummy
            past_leak_history: 'no' // Dummy
        }).then(result => {
            setAnalysis(result);
        }).catch(err => {
            console.error(err);
        }).finally(() => {
            setAnalysisLoading(false);
        });
    }
  }, [alerts, sortedAlerts, analysis]);


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

      {analysisLoading ? (
        <Card>
            <CardContent className="p-6 flex items-center justify-center">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Generating AI Diagnostic Report...
            </CardContent>
        </Card>
      ) : analysis && (
         <Alert>
            <Bot className="h-4 w-4" />
            <AlertTitle>AI Diagnostic Report</AlertTitle>
            <AlertDescription className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                <p><strong>Diagnosis:</strong> {analysis.reasoning}</p>
                <p><strong>Pressure:</strong> {analysis.pressure_status} | <strong>Leakage:</strong> {analysis.leakage_status} | <strong>Contamination:</strong> {analysis.sewage_contamination_status}</p>
                <p className="font-semibold text-destructive"><strong>Action:</strong> {analysis.recommended_actions}</p>
            </AlertDescription>
        </Alert>
      )}

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
                        <TableCell className="text-right font-mono">{typeof alert.Pressure === 'number' ? alert.Pressure.toFixed(2) : 'N/A'}</TableCell>
                        <TableCell className="text-right font-mono">{typeof alert.Flow_Rate === 'number' ? alert.Flow_Rate.toFixed(2) : 'N/A'}</TableCell>
                        <TableCell className="text-right font-mono">{typeof alert.Temperature === 'number' ? alert.Temperature.toFixed(2) : 'N/A'}</TableCell>
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
