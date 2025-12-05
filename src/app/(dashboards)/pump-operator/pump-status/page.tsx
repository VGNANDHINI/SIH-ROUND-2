
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Power } from 'lucide-react';

export default function PumpStatusPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pump Status</CardTitle>
        <CardDescription>
          Monitor and control the pumps assigned to you.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg">
          <Power className="w-16 h-16 text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">
            Pump status information will be displayed here.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
