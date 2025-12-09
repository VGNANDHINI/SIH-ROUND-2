
'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useFirestore, useUser, useDoc } from '@/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import type { PumpLog, WaterTank, UserProfile } from '@/lib/data';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { suggestWaterLevel } from '@/ai/flows/suggest-water-level';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
  const [tankName, setTankName] = useState('Main OHT');
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const { data: profile } = useDoc<UserProfile>(user ? `users/${user.uid}` : null);


  useEffect(() => {
    if (sessionToConfirm && sessionToConfirm.duration && sessionToConfirm.energyConsumed && profile) {
        setIsLoading(true);
        suggestWaterLevel({
            duration: sessionToConfirm.duration,
            energyConsumed: sessionToConfirm.energyConsumed,
            pumpDischargeRate: profile.pumpDischargeRate || 0,
            motorHorsepower: profile.motorHorsepower || 0,
            tankHeight: profile.tankHeight || 0,
            tankBaseArea: profile.tankBaseArea || 0,
        }).then(result => {
            setAiPrediction(Math.round(result.predictedLevel));
        }).catch(err => {
            console.error("AI Prediction failed:", err);
            toast({ title: 'AI Prediction Failed', description: 'Could not get a prediction. Please select a level manually.', variant: 'destructive'});
        }).finally(() => {
            setIsLoading(false);
        });
    } else {
        setAiPrediction(null);
    }
  }, [sessionToConfirm, profile, toast]);

  const handleConfirmLevel = async (level: number) => {
    if (!firestore || !sessionToConfirm || !tankName) {
        toast({ title: 'Error', description: 'Tank name is required.', variant: 'destructive' });
        return;
    };
    setIsLoading(true);

    const logRef = doc(firestore, 'pumpLogs', sessionToConfirm.id);
    const tankRef = doc(firestore, 'waterTanks', tankName.replace(/\s+/g, '-').toLowerCase());

    const logUpdate = { confirmedWaterLevel: level, tankName };
    const tankUpdate: Omit<WaterTank, 'id'> = { 
        tankId: tankName.replace(/\s+/g, '-').toLowerCase(),
        name: tankName,
        currentLevel: level, 
        lastUpdated: serverTimestamp(),
        // A default capacity, a real app would have a way to set this
        capacity: 50000 
    };

    try {
      // Update the pump log
      await setDoc(logRef, logUpdate, { merge: true });
      
      // Update the tank status
      await setDoc(tankRef, tankUpdate, { merge: true });
      
      toast({ title: 'Level Confirmed', description: `Tank '${tankName}' level set to ${level}%.` });
      onConfirmation();

    } catch (error) {
      console.error(error);
      const permissionError = new FirestorePermissionError({
        path: logRef.path,
        operation: 'update',
        requestResourceData: { logUpdate, tankUpdate },
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
        <div className="space-y-2">
            <Label htmlFor="tank-name">Tank Name</Label>
            <Input id="tank-name" value={tankName} onChange={(e) => setTankName(e.target.value)} placeholder="e.g., Main OHT" disabled={!sessionToConfirm} />
        </div>
        <div className="grid grid-cols-2 gap-2 items-center text-center p-4 bg-muted rounded-lg">
          <div>
            <p className="text-sm text-muted-foreground">Prediction</p>
            {isLoading && !aiPrediction ? <Loader2 className="h-6 w-6 mx-auto my-2 animate-spin"/> :
            <p className="text-2xl font-bold">{aiPrediction ?? '--'}%</p>
            }
          </div>
          <Button 
              disabled={!aiPrediction || !sessionToConfirm || isLoading}
              onClick={() => aiPrediction !== null && handleConfirmLevel(aiPrediction)}
          >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
              Submit
          </Button>
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
