'use client';
import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useFirestore } from '@/firebase';
import { addDoc, collection, doc, serverTimestamp, setDoc, Timestamp } from 'firebase/firestore';
import type { UserProfile, PumpLog } from '@/lib/data';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const useTimer = (startTime: Date | null) => {
    const [elapsedTime, setElapsedTime] = useState('00:00:00');
    useEffect(() => {
        if (!startTime) {
            setElapsedTime('00:00:00');
            return;
        }
        const interval = setInterval(() => {
            const now = new Date();
            const diff = now.getTime() - startTime.getTime();
            const hours = Math.floor(diff / (1000 * 60 * 60)).toString().padStart(2, '0');
            const minutes = Math.floor((diff / (1000 * 60)) % 60).toString().padStart(2, '0');
            const seconds = Math.floor((diff / 1000) % 60).toString().padStart(2, '0');
            setElapsedTime(`${hours}:${minutes}:${seconds}`);
        }, 1000);
        return () => clearInterval(interval);
    }, [startTime]);
    return elapsedTime;
};

interface PumpControlProps {
  profile: UserProfile | null;
  activeLog: PumpLog | null;
  onSessionStart: (log: PumpLog) => void;
  onSessionEnd: (log: PumpLog) => void;
}

export function PumpControl({ profile, activeLog, onSessionStart, onSessionEnd }: PumpControlProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();

  const isPumpOn = useMemo(() => !!activeLog, [activeLog]);
  const startTime = useMemo(() => {
    if (activeLog?.startTime) {
        if (activeLog.startTime instanceof Timestamp) {
            return activeLog.startTime.toDate();
        }
        if (activeLog.startTime instanceof Date) {
            return activeLog.startTime;
        }
    }
    return null;
  }, [activeLog]);

  const elapsedTime = useTimer(startTime);

  const handlePumpOn = async () => {
    if (!firestore || !profile?.uid) return;
    setIsLoading(true);

    const newLog: Omit<PumpLog, 'id' | 'startTime'> & { startTime: any } = {
      operatorId: profile.uid,
      startTime: serverTimestamp(),
      endTime: null,
      duration: 0,
      waterSupplied: 0,
      energyConsumed: 0,
      confirmedWaterLevel: null,
    };
    
    try {
      const collectionRef = collection(firestore, 'pumpLogs');
      const docRef = await addDoc(collectionRef, newLog);
      
      const optimisticLog: PumpLog = {
          ...newLog,
          id: docRef.id,
          startTime: new Date(),
          endTime: null,
      };
      onSessionStart(optimisticLog);

      toast({ title: 'Pump ON', description: 'Pump session started.' });
    } catch (error) {
      console.error(error);
      const permissionError = new FirestorePermissionError({
        path: 'pumpLogs',
        operation: 'create',
        requestResourceData: newLog,
      });
      errorEmitter.emit('permission-error', permissionError);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePumpOff = async () => {
    if (!firestore || !profile || !activeLog || !startTime) return;
    setIsLoading(true);

    const endTime = new Date();
    const duration = (endTime.getTime() - startTime.getTime()) / 1000; // in seconds
    const durationMinutes = duration / 60;
    
    // Safely access profile properties with fallbacks
    const pumpDischargeRate = profile.pumpDischargeRate || 0;
    const motorHorsepower = profile.motorHorsepower || 0;

    const waterSupplied = pumpDischargeRate * durationMinutes;
    // Energy in kWh = (HP * 0.746 * hours)
    const energyConsumed = (motorHorsepower * 0.746 * (duration / 3600));

    const logRef = doc(firestore, 'pumpLogs', activeLog.id);
    const updatedData = {
      endTime: serverTimestamp(),
      duration: Math.round(duration),
      waterSupplied: Math.round(waterSupplied),
      energyConsumed: parseFloat(energyConsumed.toFixed(2)),
    };
    
    try {
      await setDoc(logRef, updatedData, { merge: true });
      onSessionEnd({ ...activeLog, ...updatedData, endTime: endTime, startTime: activeLog.startTime });
      toast({ title: 'Pump OFF', description: 'Session ended. Please confirm water level.' });
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
        <CardTitle>Pump Control</CardTitle>
        <CardDescription>Start or stop the pump to log a new session.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex gap-4">
          <Button onClick={handlePumpOn} disabled={isPumpOn || isLoading} className="w-full">
            {isPumpOn && startTime ? `ON (${elapsedTime})` : 'PUMP ON'}
          </Button>
          <Button onClick={handlePumpOff} disabled={!isPumpOn || isLoading} variant="destructive" className="w-full">
            {isLoading && isPumpOn ? <Loader2 className="animate-spin" /> : 'PUMP OFF'}
          </Button>
        </div>
        <div className="text-center">
            <p className="text-sm text-muted-foreground">Current Status</p>
            <p className={`text-lg font-bold ${isPumpOn ? 'text-green-600' : 'text-red-600'}`}>{isPumpOn ? 'ON' : 'OFF'}</p>
        </div>
      </CardContent>
    </Card>
  );
}
