
'use client';

import { useWaterQualityTests, useUser, useDoc } from "@/firebase";
import { UserProfile, WaterTest } from "@/lib/data";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function VillageResidentWaterQualityPage() {
    const { user, loading: userLoading } = useUser();
    const { data: profile, loading: profileLoading } = useDoc<UserProfile>(user ? `users/${user.uid}` : null);
    const { data: tests, loading: testsLoading } = useWaterQualityTests(profile?.panchayat || 'default');

    const loading = userLoading || profileLoading || (!!profile && testsLoading);

    const latestTest = tests ? tests[0] : null;

    const getStatusVariant = (status?: WaterTest['status']) => {
        if (!status) return 'outline';
        switch (status) {
            case 'safe': return 'success';
            case 'unsafe': return 'destructive';
            case 'attention-needed': return 'secondary';
            default: return 'outline';
        }
    }
    
    const getStatusMessage = (status?: WaterTest['status']) => {
        if (!status) return 'No data available.';
        switch (status) {
            case 'safe': return 'Water is safe for consumption.';
            case 'unsafe': return 'Water is unsafe. Please boil before use. Authorities have been notified.';
            case 'attention-needed': return 'Quality is being monitored. Currently safe.';
            default: return 'Status is unknown.';
        }
    }

    return (
        <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
                <CardTitle>Current Water Quality</CardTitle>
                <CardDescription>
                    This is the most recent water quality status for your panchayat, {profile?.panchayat}.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-48 gap-4">
                        <Loader2 className="h-10 w-10 animate-spin" />
                        <p className="text-muted-foreground">Fetching latest data...</p>
                    </div>
                ) : latestTest ? (
                    <div className="flex flex-col items-center text-center gap-4 p-6 rounded-lg bg-muted/50">
                        <p className="text-sm text-muted-foreground">Last Tested on {latestTest.testDate ? new Date((latestTest.testDate as any).seconds * 1000).toLocaleDateString() : 'N/A'}</p>
                        <Badge variant={getStatusVariant(latestTest.status)} className="text-lg px-4 py-1">{latestTest.status}</Badge>
                        <p className="max-w-md">{getStatusMessage(latestTest.status)}</p>
                        {latestTest.status === 'unsafe' && (
                             <p className="text-destructive font-semibold text-sm">Flagged Parameters: {latestTest.flaggedParameters?.join(', ')}</p>
                        )}
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-48">
                        <p className="text-muted-foreground">No water quality tests have been recorded for your panchayat yet.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

    