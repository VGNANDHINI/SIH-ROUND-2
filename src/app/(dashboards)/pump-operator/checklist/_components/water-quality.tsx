
'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useFirestore } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import type { DailyChecklist } from '@/lib/data';
import { useDebounce } from 'use-debounce';

interface WaterQualityProps {
  checklist: DailyChecklist | null;
  checklistPath: string | null;
}

const CHLORINE_MIN = 0.2;
const TURBIDITY_MAX = 1;

export function WaterQuality({ checklist, checklistPath }: WaterQualityProps) {
  const firestore = useFirestore();
  const [chlorine, setChlorine] = useState(checklist?.waterQuality?.chlorine ?? 0.5);
  const [turbidity, setTurbidity] = useState(checklist?.waterQuality?.turbidity ?? 0.8);
  
  const [debouncedChlorine] = useDebounce(chlorine, 500);
  const [debouncedTurbidity] = useDebounce(turbidity, 500);
  
  const chlorineOk = chlorine >= CHLORINE_MIN;
  const turbidityOk = turbidity <= TURBIDITY_MAX;
  const needsAttention = !chlorineOk || !turbidityOk;

  useEffect(() => {
    if (!firestore || !checklistPath) return;

    const dataToUpdate = {
        waterQuality: {
            chlorine: debouncedChlorine,
            turbidity: debouncedTurbidity,
            needsAttention,
        }
    };
    
    setDoc(doc(firestore, checklistPath), dataToUpdate, { merge: true }).catch(console.error);

  }, [debouncedChlorine, debouncedTurbidity, needsAttention, firestore, checklistPath]);

  const filled = checklist?.waterQuality !== undefined;

  return (
    <Card className={filled ? 'bg-muted/50' : ''}>
      <CardHeader>
        <CardTitle>3. Water Quality</CardTitle>
        <CardDescription>Enter readings for free residual chlorine and turbidity.</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
            <Label htmlFor="chlorine">Free Residual Chlorine (mg/L)</Label>
            <Input 
                id="chlorine" 
                type="number" 
                step="0.1" 
                value={chlorine}
                onChange={(e) => setChlorine(parseFloat(e.target.value) || 0)}
                className={!chlorineOk ? 'border-destructive' : ''}
            />
            {!chlorineOk && <Badge variant="destructive">Low Chlorine</Badge>}
        </div>
         <div className="space-y-2">
            <Label htmlFor="turbidity">Turbidity (NTU)</Label>
            <Input 
                id="turbidity" 
                type="number" 
                step="0.1" 
                value={turbidity}
                onChange={(e) => setTurbidity(parseFloat(e.target.value) || 0)}
                className={!turbidityOk ? 'border-destructive' : ''}
            />
            {!turbidityOk && <Badge variant="destructive">High Turbidity</Badge>}
        </div>
      </CardContent>
    </Card>
  );
}
