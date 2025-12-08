
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
      leakages: alerts.filter(a => a.Leak_Status === 1).length,
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
                                  <Gauge className="h-4 w-4" /><span>{alert.Pressure.toFixed(2)} bar</span>
                                  <Droplets className="h-4 w-4" /><span>{alert.Flow_Rate.toFixed(2)} L/s</span>
                                  <Thermometer className="h-4 w-4" /><span>{alert.Temperature.toFixed(2)}°C</span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Pressure: {alert.Pressure.toFixed(2)} bar</p>
                                <p>Flow Rate: {alert.Flow_Rate.toFixed(2)} L/s</p>
                                <p>Temperature: {alert.Temperature.toFixed(2)}°C</p>
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
            <CardTitle>Colab Integration Snippet</CardTitle>
            <CardDescription>Use this Python code in your Google Colab notebook to send data to this dashboard.</CardDescription>
        </CardHeader>
        <CardContent className="bg-muted p-4 rounded-lg">
            <pre className="text-sm whitespace-pre-wrap"><code>
{`import firebase_admin
from firebase_admin import credentials, firestore
import pandas as pd
import datetime

# --- IMPORTANT ---
# 1. Upload your Firebase service account key JSON file to Colab.
# 2. Replace 'path/to/your/serviceAccountKey.json' with the actual path.

cred = credentials.Certificate('path/to/your/serviceAccountKey.json')

# Initialize the app if not already initialized
if not firebase_admin._apps:
    firebase_admin.initialize_app(cred)

db = firestore.client()

def upload_df_to_firestore(df):
    """Uploads a pandas DataFrame to the 'leakageAlerts' collection."""
    collection_ref = db.collection('leakageAlerts')
    
    for index, row in df.iterrows():
        # Create a dictionary from the row
        data = row.to_dict()
        
        # Convert pandas timestamp to Python datetime if necessary
        if isinstance(data['Timestamp'], pd.Timestamp):
            data['Timestamp'] = data['Timestamp'].to_pydatetime()
        
        # Firestore expects native Python types
        data['Pressure'] = float(data['Pressure'])
        data['Flow_Rate'] = float(data['Flow_Rate'])
        data['Temperature'] = float(data['Temperature'])
        data['Leak_Status'] = int(data['Leak_Status'])
        data['Burst_Status'] = int(data['Burst_Status'])
        
        # Add a new document with an auto-generated ID
        doc_ref = collection_ref.document()
        doc_ref.set(data)
        print(f"Uploaded record for sensor {data['Sensor_ID']} at {data['Timestamp']}")

# --- Example Usage ---
# Assume 'processed_df' is your final pandas DataFrame after analysis

# Create a sample DataFrame that matches your structure
sample_data = {
    'Timestamp': [datetime.datetime.now() - datetime.timedelta(minutes=1), datetime.datetime.now()],
    'Sensor_ID': ['S007', 'S002'],
    'Pressure': [3.69, 2.44],
    'Flow_Rate': [77.51, 210.13],
    'Temperature': [21.69, 10.01],
    'Leak_Status': [0, 1],
    'Burst_Status': [0, 0],
    'Leakage_Alerts': ['✔ No leakage detected', '🔴 Confirmed Leakage from Sensor']
}
processed_df = pd.DataFrame(sample_data)

# Call the function to upload
upload_df_to_firestore(processed_df)`}
            </code></pre>
        </CardContent>
      </Card>

    </div>
  );
}
