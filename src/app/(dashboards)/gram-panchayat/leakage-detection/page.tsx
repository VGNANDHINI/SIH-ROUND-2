
'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useCollection } from '@/firebase/firestore/use-collection';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';

// Define the structure of the sensor data
type SensorReading = {
  id: string;
  timestamp: Timestamp;
  sensor_id: string;
  pressure: number;
  flow_rate: number;
  location: {
    lat: number;
    lng: number;
  };
  turbidity?: number;
  pH?: number;
  chlorine?: number;
  leakage_status?: 'Normal' | 'Leak Detected' | 'Critical Leakage / Pipe Burst';
};

// Define the structure for processed data with inferred status
type ProcessedSensorReading = SensorReading & {
  inferred_status: 'Normal' | 'Leak Detected' | 'Critical Leakage / Pipe Burst';
};

// Dynamically import the map component to avoid SSR issues with Leaflet
const LeakageMap = dynamic(() => import('./_components/leakage-map'), {
  ssr: false,
  loading: () => <div className="h-[500px] bg-muted rounded-lg flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>,
});

export default function LeakageDetectionPortal() {
  const { data: sensorData, loading } = useCollection<SensorReading>('test_connection');

  const processedData = useMemo(() => {
    if (!sensorData) return [];

    const latestReadings: { [key: string]: ProcessedSensorReading } = {};

    sensorData.forEach((doc) => {
      const pressure = doc.pressure || 0;
      const flowRate = doc.flow_rate || 0;

      let inferred_status: ProcessedSensorReading['inferred_status'] = 'Normal';

      if (doc.leakage_status) {
        inferred_status = doc.leakage_status;
      } else {
        if (pressure < 0.5) {
          inferred_status = 'Critical Leakage / Pipe Burst';
        } else if (pressure < 1.0 && flowRate > 20) {
          inferred_status = 'Leak Detected';
        }
      }

      const processedDoc = { ...doc, inferred_status };
      
      // Keep only the latest reading for each sensor
      if (!latestReadings[doc.sensor_id] || doc.timestamp.toMillis() > latestReadings[doc.sensor_id].timestamp.toMillis()) {
          latestReadings[doc.sensor_id] = processedDoc;
      }
    });

    return Object.values(latestReadings);
  }, [sensorData]);

  const getStatusVariant = (status: ProcessedSensorReading['inferred_status']) => {
    switch (status) {
      case 'Critical Leakage / Pipe Burst':
      case 'Leak Detected':
        return 'destructive';
      case 'Normal':
        return 'success';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Live Leakage Detection Map</CardTitle>
          <CardDescription>Real-time status of water sensors across the network.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading && processedData.length === 0 ? (
            <div className="h-[500px] bg-muted rounded-lg flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : (
            <LeakageMap sensorData={processedData} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Live Sensor Data</CardTitle>
          <CardDescription>Displaying the most recent reading from each active sensor.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sensor ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Pressure (bar)</TableHead>
                <TableHead>Flow Rate (L/s)</TableHead>
                <TableHead>Last Reading</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                  </TableCell>
                </TableRow>
              ) : processedData.length > 0 ? (
                processedData.sort((a,b) => a.sensor_id.localeCompare(b.sensor_id)).map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.sensor_id}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(item.inferred_status)}>
                        {item.inferred_status}
                      </Badge>
                    </TableCell>
                    <TableCell>{item.pressure?.toFixed(2)}</TableCell>
                    <TableCell>{item.flow_rate?.toFixed(2)}</TableCell>
                    <TableCell>{item.timestamp?.toDate().toLocaleString()}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24">
                    No sensor data available in 'test_connection' collection.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
