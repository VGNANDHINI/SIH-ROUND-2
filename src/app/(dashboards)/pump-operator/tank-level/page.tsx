
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Layers } from 'lucide-react';

export default function PumpOperatorTankLevelPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Water Tank Level</CardTitle>
        <CardDescription>
          Monitor the water levels of tanks assigned to you.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg">
          <Layers className="w-16 h-16 text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">
            Tank level data will be displayed here.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
