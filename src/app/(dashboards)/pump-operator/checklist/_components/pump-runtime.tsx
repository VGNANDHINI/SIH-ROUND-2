
'use client';
import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Loader2 } from 'lucide-react';
import type { DailyChecklist, PumpLog, UserProfile } from '@/lib/data';
import { useCollection, useFirestore } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';

interface PumpRuntimeProps {
  checklist: DailyChecklist | null;
  checklistPath: string | null;
  profile: UserProfile | null;
}

export function PumpRuntime({ checklist, checklistPath, profile }: PumpRuntimeProps) {
  const { data: pumpLogs, loading: logsLoading } = useCollection<PumpLog>('pumpLogs');
  const firestore = useFirestore();
  const [isConfirming, setIsConfirming] = useState(false);

  const todayStats = useMemo(() => {
    if (!pumpLogs || !profile) return { totalRuntime: 0, estimatedVolume: 0 };

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayLogs = pumpLogs.filter(log =>
      log.operatorId === profile.uid &&
      log.endTime &&
      log.endTime.seconds * 1000 >= todayStart.getTime()
    );

    const totalRuntime = todayLogs.reduce((acc, log) => acc + (log.duration || 0), 0); // in seconds
    const estimatedVolume = todayLogs.reduce((acc, log) => acc + (log.waterSupplied || 0), 0); // in liters

    return { totalRuntime: totalRuntime / 3600, estimatedVolume }; // convert runtime to hours
  }, [pumpLogs, profile]);

  // Effect to auto-fill data if not confirmed
  useEffect(() => {
    if (firestore && checklistPath && !checklist?.pumpData?.confirmed && todayStats.totalRuntime > 0) {
        setDoc(doc(firestore, checklistPath), {
            pumpData: {
                totalRuntime: parseFloat(todayStats.totalRuntime.toFixed(2)),
                estimatedVolume: Math.round(todayStats.estimatedVolume),
            }
        }, { merge: true }).catch(console.error);
    }
  }, [firestore, checklistPath, checklist, todayStats]);


  const handleConfirm = async () => {
    if (!firestore || !checklistPath) return;
    setIsConfirming(true);
    try {
      await setDoc(doc(firestore, checklistPath), {
        pumpData: { ...checklist?.pumpData, confirmed: true }
      }, { merge: true });
    } catch (error) {
      console.error("Failed to confirm pump runtime:", error);
    } finally {
      setIsConfirming(false);
    }
  };

  const confirmed = checklist?.pumpData?.confirmed || false;

  return (
    <Card className={confirmed ? 'bg-muted/50' : ''}>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle>1. Pump Runtime</CardTitle>
          <CardDescription>Review and confirm today's automated pump logs.</CardDescription>
        </div>
        <Button size="sm" onClick={handleConfirm} disabled={confirmed || isConfirming}>
            {isConfirming ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Check className="mr-2 h-4 w-4" />}
            {confirmed ? 'Confirmed' : 'Confirm'}
        </Button>
      </CardHeader>
      <CardContent>
        {logsLoading ? <Loader2 className="h-6 w-6 animate-spin"/> : (
            <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-4 rounded-lg bg-background">
                    <p className="text-sm text-muted-foreground">Total Runtime (Today)</p>
                    <p className="text-2xl font-bold">
                        {checklist?.pumpData?.totalRuntime?.toFixed(2) ?? todayStats.totalRuntime.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">hours</p>
                </div>
                <div className="p-4 rounded-lg bg-background">
                    <p className="text-sm text-muted-foreground">Est. Volume Supplied</p>
                    <p className="text-2xl font-bold">
                        {checklist?.pumpData?.estimatedVolume?.toLocaleString() ?? todayStats.estimatedVolume.toLocaleString()}
                    </p>
                     <p className="text-xs text-muted-foreground">liters</p>
                </div>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
