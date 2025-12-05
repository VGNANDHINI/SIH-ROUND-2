
'use client';

import { useUser, useDoc, useFirestore } from '@/firebase';
import type { UserProfile, DailyChecklist } from '@/lib/data';
import { doc, setDoc } from 'firebase/firestore';
import { useEffect, useState, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PumpRuntime } from './_components/pump-runtime';
import { TankLevels } from './_components/tank-levels';
import { WaterQuality } from './_components/water-quality';

function getChecklistId(userId: string) {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    return `${today}_${userId}`;
}

const TOTAL_CHECKLIST_ITEMS = 10;

export default function ChecklistPage() {
    const { user, loading: userLoading } = useUser();
    const { data: profile, loading: profileLoading } = useDoc<UserProfile>(user ? `users/${user.uid}` : null);
    
    const checklistId = useMemo(() => user ? getChecklistId(user.uid) : null, [user]);
    const checklistPath = useMemo(() => (profile && checklistId) ? `panchayats/${profile.panchayat}/checklists/${checklistId}` : null, [profile, checklistId]);

    const { data: checklist, loading: checklistLoading } = useDoc<DailyChecklist>(checklistPath);
    const firestore = useFirestore();

    const [isCreating, setIsCreating] = useState(false);

    // Effect to create a new checklist document if one doesn't exist for the day
    useEffect(() => {
        if (!firestore || !checklistPath || checklistLoading || isCreating || checklist) return;

        const createChecklist = async () => {
            setIsCreating(true);
            const newChecklist: Omit<DailyChecklist, 'id'> = {
                date: new Date().toISOString().split('T')[0],
                operatorId: user!.uid,
                panchayatId: profile!.panchayat,
                completedPercentage: 0,
                status: 'Pending',
            };
            try {
                await setDoc(doc(firestore, checklistPath), newChecklist);
            } catch (error) {
                console.error("Failed to create checklist:", error);
            } finally {
                setIsCreating(false);
            }
        };

        createChecklist();

    }, [firestore, checklistPath, checklist, checklistLoading, isCreating, user, profile]);
    
    const loading = userLoading || profileLoading || checklistLoading || isCreating;

    const completionPercentage = useMemo(() => {
        if (!checklist) return 0;
        let completedCount = 0;
        if (checklist.pumpData?.confirmed) completedCount++;
        if (checklist.tankLevels?.startOfDay !== undefined && checklist.tankLevels?.endOfDay !== undefined) completedCount++;
        if (checklist.waterQuality?.chlorine !== undefined && checklist.waterQuality?.turbidity !== undefined) completedCount++;
        // Add checks for other 7 modules here...
        
        return Math.round((completedCount / TOTAL_CHECKLIST_ITEMS) * 100);
    }, [checklist]);

    if (loading) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Daily O&amp;M Checklist - {new Date().toLocaleDateString()}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-medium">{completionPercentage}% Complete</span>
                        <Progress value={completionPercentage} className="flex-1" />
                    </div>
                </CardContent>
            </Card>
            
            <div className="space-y-4">
                <PumpRuntime checklist={checklist} checklistPath={checklistPath} profile={profile}/>
                <TankLevels checklist={checklist} checklistPath={checklistPath} profile={profile}/>
                <WaterQuality checklist={checklist} checklistPath={checklistPath} />
                {/* Other 7 components will be added here */}
                 <Card><CardContent className="p-6 text-center text-muted-foreground">7 more checklist modules to be added here.</CardContent></Card>
            </div>
        </div>
    );
}
