'use client';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useFirestore } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import type { PumpLog } from '@/lib/data';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { suggestWaterLevel } from '@/ai/flows/suggest-water-level';

interface AiWaterLevelConfirmProps {
  sessionToConfirm: PumpLog | null;
  onConfirmation: () => void;
}

const levels = [
  { label: 'Empty', value: 0 },
  { label: '25%', value: 25 },
  { label: '50%', value: 50 },
  { label: '75%', value: 75 },
  { label: '85%', value: 85 },
  { label: 'Full', value: 100 },
];

export function AiWaterLevelConfirm({ sessionToConfirm, onConfirmation }: AiWaterLevelConfirmProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [aiPrediction, setAiPrediction] = useState<number | null>(null);
  const { toast } = useToast();
  const firestore = useFirestore();

  useState(() => {
    if (sessionToConfirm) {
        setIsLoading(true);
        suggestWaterLevel({
            duration: sessionToConfirm.duration || 0,
            energyConsumed: sessionToConfirm.energyConsumed || 0,
        }).then(result => {
            setAiPrediction(result.predictedLevel);
        }).finally(() => {
            setIsLoading(false);
        });
    }
  });

  const handleConfirmLevel = async (level: number) => {
    if (!firestore || !sessionToConfirm) return;
    setIsLoading(true);

    const logRef = doc(firestore, 'pumpLogs', sessionToConfirm.id);
    const updatedData = { confirmedWaterLevel: level };

    try {
      await setDoc(logRef, updatedData, { merge: true });
      toast({ title: 'Level Confirmed', description: `Tank level set to ${level}%.` });
      onConfirmation();
    } catch (error) {
      console.error(error);
      const permissionError = new FirestorePermissionError({
        path: logRef.path,
        operation: 'update',
        requestResourceData: updatedData,
      });
      errorEmitter.emit('permission-error', permissionError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Confirm or Override Level</CardTitle>
        <CardDescription>
          This will be enabled after a pump session ends.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">AI Prediction</p>
            {isLoading && !aiPrediction ? <Loader2 className="h-6 w-6 mx-auto my-2 animate-spin"/> :
            <p className="text-2xl font-bold">{aiPrediction ?? '--'}%</p>
            }
        </div>
        <div className="grid grid-cols-3 gap-2">
            {levels.map(level => (
                <Button 
                    key={level.value}
                    variant="outline"
                    disabled={!sessionToConfirm || isLoading}
                    onClick={() => handleConfirmLevel(level.value)}
                >
                    {level.label}
                </Button>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}
