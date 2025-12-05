
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Layers } from 'lucide-react';

export default function TankLevelsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>All Water Tank Levels</CardTitle>
        <CardDescription>
          Monitor the real-time water levels of all tanks in your panchayat.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg">
            <Layers className="w-16 h-16 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">Water tank level data will be displayed here.</p>
        </div>
      </CardContent>
    </Card>
  );
}
