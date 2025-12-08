
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

  const stats = useMemo(() => {
    if (!alerts) return { leakages: 0, bursts: 0, warnings: 0, normal: 0 };
    return {
      leakages: alerts.filter(a => a.Leak_Status == 1).length,
      bursts: alerts.filter(a => a.Burst_Status === 1).length,
      warnings: alerts.filter(a => a.Leakage_Alerts.includes('Possible Leakage')).length,
      normal: alerts.filter(a => a.Leakage_Alerts.includes('No leakage')).length,
    };
  }, [alerts]);

  useEffect(() => {
    if(alerts && alerts.length > 0) {
        setAnalysisLoading(true);
        const latestAlert = sortedAlerts[0];
        const leakComplaints = alerts.filter(a => a.Leak_Status === 1).length;

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
            setAnalysisLoading(false);
        }).catch(err => {
            console.error(err);
            setAnalysisLoading(false);
        });
    }
  }, [alerts, sortedAlerts]);


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
                    <TableRow>
                        <TableCell className="font-medium flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-destructive" /> Confirmed Leakages</TableCell>
                        <TableCell className="text-right text-lg font-bold">{stats.leakages}</TableCell>
                    </TableRow>
                     <TableRow>
                        <TableCell className="font-medium flex items-center gap-2"><ShieldAlert className="h-4 w-4 text-destructive" /> Pipeline Bursts</TableCell>
                        <TableCell className="text-right text-lg font-bold">{stats.bursts}</TableCell>
                    </TableRow>
                     <TableRow>
                        <TableCell className="font-medium flex items-center gap-2"><Signal className="h-4 w-4 text-yellow-500" /> Low-Pressure Warnings</TableCell>
                        <TableCell className="text-right text-lg font-bold">{stats.warnings}</TableCell>
                    </TableRow>
                     <TableRow>
                        <TableCell className="font-medium flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> Normal Readings</TableCell>
                        <TableCell className="text-right text-lg font-bold">{stats.normal}</TableCell>
                    </TableRow>
                </TableBody>
            </Table>
           )}
        </CardContent>
      </Card>
    </div>
  );
}
