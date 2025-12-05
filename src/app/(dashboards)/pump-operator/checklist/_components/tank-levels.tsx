
'use client';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useFirestore } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import type { DailyChecklist, UserProfile } from '@/lib/data';

interface TankLevelsProps {
  checklist: DailyChecklist | null;
  checklistPath: string | null;
  profile: UserProfile | null;
}

export function TankLevels({ checklist, checklistPath, profile }: TankLevelsProps) {
  const firestore = useFirestore();
  const [startLevel, setStartLevel] = useState(checklist?.tankLevels?.startOfDay ?? 20);
  const [endLevel, setEndLevel] = useState(checklist?.tankLevels?.endOfDay ?? 85);

  const handleLevelChange = (type: 'start' | 'end', value: number) => {
    if (type === 'start') {
      setStartLevel(value);
    } else {
      setEndLevel(value);
    }
    
    if (!firestore || !checklistPath) return;

    const newLevels = {
      startOfDay: type === 'start' ? value : startLevel,
      endOfDay: type === 'end' ? value : endLevel,
    };
    
    setDoc(doc(firestore, checklistPath), {
      tankLevels: newLevels,
    }, { merge: true }).catch(console.error);
  };
  
  const volumeChange = useMemo(() => {
    if (!profile?.tankBaseArea || !profile?.tankHeight) return 0;
    const tankVolume = profile.tankBaseArea * profile.tankHeight * 1000; // in liters
    const startVolume = tankVolume * (startLevel / 100);
    const endVolume = tankVolume * (endLevel / 100);
    return endVolume - startVolume;
  }, [startLevel, endLevel, profile]);

  const filled = checklist?.tankLevels?.startOfDay !== undefined;

  return (
    <Card className={filled ? 'bg-muted/50' : ''}>
      <CardHeader>
        <CardTitle>2. Tank Levels</CardTitle>
        <CardDescription>Enter the start and end of day water levels for the main tank.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
            <div className="flex justify-between items-baseline">
                 <label className="text-sm font-medium">Tank Level - Start of Day</label>
                 <span className="text-lg font-bold">{startLevel}%</span>
            </div>
            <Slider
                value={[startLevel]}
                onValueChange={(v) => handleLevelChange('start', v[0])}
                max={100}
                step={5}
            />
        </div>
         <div className="space-y-3">
            <div className="flex justify-between items-baseline">
                 <label className="text-sm font-medium">Tank Level - End of Day</label>
                 <span className="text-lg font-bold">{endLevel}%</span>
            </div>
            <Slider
                value={[endLevel]}
                onValueChange={(v) => handleLevelChange('end', v[0])}
                max={100}
                step={5}
            />
        </div>
        <div className="p-4 rounded-lg bg-background text-center">
            <p className="text-sm text-muted-foreground">Net Water Volume Change</p>
            <p className="text-2xl font-bold">{volumeChange > 0 ? '+' : ''}{volumeChange.toLocaleString()} L</p>
        </div>
      </CardContent>
    </Card>
  );
}
