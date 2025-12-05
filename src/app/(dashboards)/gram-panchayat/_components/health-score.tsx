'use client';

import { useMemo } from 'react';
import { useComplaints, usePumpIssues, useWaterQualityTests, useDailyChecklists, useUser, useDoc } from '@/firebase';
import type { Complaint, PumpIssue, WaterTest, DailyChecklist, UserProfile } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2, ShieldCheck, Droplets, ClipboardCheck, Wrench, ArrowUp, ArrowDown, ArrowRight } from 'lucide-react';

const calculateReliabilityScore = (issues: PumpIssue[] | null): number => {
    if (!issues || issues.length === 0) return 25; // Perfect score if no issues
    const openIssues = issues.filter(i => i.status === 'Open').length;
    const score = (1 - (openIssues / issues.length)) * 25;
    return Math.max(0, Math.round(score));
};

const calculateQualityScore = (tests: WaterTest[] | null): number => {
    if (!tests || tests.length === 0) return 25; // Perfect score if no tests (or default to a lower score)
    const safeTests = tests.filter(t => t.status === 'safe').length;
    const score = (safeTests / tests.length) * 25;
    return Math.round(score);
};

const calculateTasksScore = (checklists: DailyChecklist[] | null): number => {
    if (!checklists || checklists.length === 0) return 15; // Start with a medium score
    const avgCompletion = checklists.reduce((acc, c) => acc + (c.completedPercentage || 0), 0) / checklists.length;
    const score = (avgCompletion / 100) * 25;
    return Math.round(score);
};

const calculateComplaintsScore = (complaints: Complaint[] | null): number => {
    const resolved = complaints?.filter(c => c.status === 'Resolved' && c.taskStartedAt && c.taskCompletedAt) || [];
    if (resolved.length === 0) return 20; // Default good score if no resolved complaints to measure
    
    const totalTime = resolved.reduce((acc, c) => {
        const start = c.taskStartedAt.seconds * 1000;
        const end = c.taskCompletedAt.seconds * 1000;
        return acc + (end - start);
    }, 0);

    const avgTimeHours = (totalTime / resolved.length) / (1000 * 60 * 60);

    // Inverse score: less time = higher score. Capped at 48 hours.
    const score = (1 - Math.min(avgTimeHours, 48) / 48) * 25;
    return Math.max(0, Math.round(score));
};


export function HealthScore() {
    const { user } = useUser();
    const { data: profile } = useDoc<UserProfile>(user ? `users/${user.uid}` : null);
    
    // In a real app, these would be filtered by panchayat on the backend.
    const { data: pumpIssues, loading: issuesLoading } = usePumpIssues();
    const { data: waterTests, loading: testsLoading } = useWaterQualityTests(profile?.panchayat ?? '');
    const { data: checklists, loading: checklistsLoading } = useDailyChecklists(profile?.panchayat ?? '');
    const { data: complaints, loading: complaintsLoading } = useComplaints();

    const loading = issuesLoading || testsLoading || checklistsLoading || complaintsLoading;

    const panchayatComplaints = useMemo(() => {
        if (!complaints || !profile) return [];
        return complaints.filter(c => c.userPanchayat === profile.panchayat);
    }, [complaints, profile]);
    
    const reliabilityScore = useMemo(() => calculateReliabilityScore(pumpIssues), [pumpIssues]);
    const qualityScore = useMemo(() => calculateQualityScore(waterTests), [waterTests]);
    const tasksScore = useMemo(() => calculateTasksScore(checklists), [checklists]);
    const complaintsScore = useMemo(() => calculateComplaintsScore(panchayatComplaints), [panchayatComplaints]);

    const totalScore = reliabilityScore + qualityScore + tasksScore + complaintsScore;
    const trend = 'up'; // Placeholder for trend logic

    const getScoreColor = (score: number) => {
        if (score > 80) return 'text-green-500';
        if (score > 60) return 'text-yellow-500';
        return 'text-red-500';
    };
    
    const TrendIcon = () => {
        if(trend === 'up') return <ArrowUp className="h-5 w-5 text-green-500" />;
        if(trend === 'down') return <ArrowDown className="h-5 w-5 text-red-500" />;
        return <ArrowRight className="h-5 w-5 text-gray-500" />;
    }

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Panchayat Health Score</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center h-48">
                    <Loader2 className="h-8 w-8 animate-spin"/>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Panchayat Health Score</CardTitle>
                <CardDescription>An overview of your panchayat's operational performance.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center justify-center gap-4 text-center">
                    <div className="flex-1">
                        <p className={`text-6xl font-bold ${getScoreColor(totalScore)}`}>{totalScore}</p>
                        <p className="text-sm text-muted-foreground">out of 100</p>
                    </div>
                    <div className="flex flex-col items-center">
                        <TrendIcon />
                        <p className="text-xs text-muted-foreground">vs. last week</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-muted-foreground"><Wrench className="h-4 w-4" /><span>Reliability</span></div>
                        <Progress value={(reliabilityScore / 25) * 100} />
                        <p className="font-medium text-right">{reliabilityScore} / 25 pts</p>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-muted-foreground"><Droplets className="h-4 w-4" /><span>Quality</span></div>
                        <Progress value={(qualityScore / 25) * 100} />
                        <p className="font-medium text-right">{qualityScore} / 25 pts</p>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-muted-foreground"><ClipboardCheck className="h-4 w-4" /><span>Tasks</span></div>
                        <Progress value={(tasksScore / 25) * 100} />
                        <p className="font-medium text-right">{tasksScore} / 25 pts</p>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-muted-foreground"><ShieldCheck className="h-4 w-4" /><span>Complaints</span></div>
                        <Progress value={(complaintsScore / 25) * 100} />
                        <p className="font-medium text-right">{complaintsScore} / 25 pts</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
