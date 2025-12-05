
'use client';
import { useState } from 'react';
import { useUser, useDoc, useComplaints, usePumpLogs, useWaterQualityTests } from '@/firebase';
import type { UserProfile } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, FileDown } from 'lucide-react';
import { KpiCards } from './_components/kpi-cards';
import { RepairIncidentsChart } from './_components/repair-incidents-chart';
import { WaterQualitySummary } from './_components/water-quality-summary';

export default function PublicTransparencyReportPage() {
    const { user, loading: userLoading } = useUser();
    const { data: profile, loading: profileLoading } = useDoc<UserProfile>(user ? `users/${user.uid}` : null);
    
    // In a real app, these hooks would be filtered by panchayat on the backend.
    // Here we fetch all and will rely on profile data to filter, which is not ideal for scale but works for the prototype.
    const { data: allComplaints, loading: complaintsLoading } = useComplaints();
    const { data: allPumpLogs, loading: pumpLogsLoading } = usePumpLogs();
    const { data: allWaterTests, loading: testsLoading } = useWaterQualityTests(profile?.panchayat ?? 'default');

    const [timeframe, setTimeframe] = useState('weekly');

    const loading = userLoading || profileLoading || complaintsLoading || pumpLogsLoading || testsLoading;

    // The filtering logic will be improved once backend filtering is in place.
    // For now, we assume all fetched data belongs to the user's panchayat.

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div>
                    <h1 className="text-2xl font-bold font-headline">Public Transparency Report</h1>
                    <p className="text-muted-foreground">
                        An overview of water supply operations for {profile?.panchayat ?? 'your panchayat'}.
                    </p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <Select value={timeframe} onValueChange={setTimeframe}>
                        <SelectTrigger className="w-full md:w-[180px]">
                            <SelectValue placeholder="Select timeframe" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="weekly">This Week</SelectItem>
                            <SelectItem value="monthly">This Month</SelectItem>
                            <SelectItem value="quarterly">This Quarter</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline">
                        <FileDown className="mr-2" />
                        Download PDF
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-10 w-10 animate-spin" />
                </div>
            ) : (
                <div className="space-y-8">
                    <KpiCards
                        complaints={allComplaints}
                        pumpLogs={allPumpLogs}
                        waterTests={allWaterTests}
                        loading={loading}
                    />

                    <div className="grid lg:grid-cols-2 gap-8">
                        <RepairIncidentsChart complaints={allComplaints} />
                        <WaterQualitySummary waterTests={allWaterTests} />
                    </div>
                </div>
            )}
        </div>
    );
}
