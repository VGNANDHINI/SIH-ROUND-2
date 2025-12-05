
'use client';
import { useWaterQualityTests, useUser, useDoc } from "@/firebase";
import { UserProfile, WaterTest } from "@/lib/data";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function GramPanchayatWaterQualityPage() {
    const { user, loading: userLoading } = useUser();
    const { data: profile, loading: profileLoading } = useDoc<UserProfile>(user ? `users/${user.uid}` : null);
    // Note: The hook expects a panchayatId. We'll pass it once the profile loads.
    const { data: tests, loading: testsLoading } = useWaterQualityTests(profile?.panchayat || 'default');

    const loading = userLoading || profileLoading || (!!profile && testsLoading);
    
    const getStatusVariant = (status: WaterTest['status']) => {
        switch (status) {
            case 'safe': return 'success';
            case 'unsafe': return 'destructive';
            case 'attention-needed': return 'secondary';
            default: return 'outline';
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Panchayat Water Quality</CardTitle>
                <CardDescription>Review all water quality tests submitted for {profile?.panchayat}.</CardDescription>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Ward</TableHead>
                                <TableHead>Location</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Flagged</TableHead>
                                <TableHead>pH</TableHead>
                                <TableHead>Turbidity</TableHead>
                                <TableHead>Chlorine</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tests && tests.length > 0 ? tests.map(test => (
                                <TableRow key={test.id}>
                                    <TableCell>{test.testDate ? new Date((test.testDate as any).seconds * 1000).toLocaleDateString() : 'N/A'}</TableCell>
                                    <TableCell>{test.ward}</TableCell>
                                    <TableCell>{test.locationType}</TableCell>
                                    <TableCell><Badge variant={getStatusVariant(test.status)}>{test.status}</Badge></TableCell>
                                    <TableCell className="max-w-xs truncate">{test.flaggedParameters?.join(', ') || 'None'}</TableCell>
                                    <TableCell>{test.pH}</TableCell>
                                    <TableCell>{test.turbidity}</TableCell>
                                    <TableCell>{test.chlorine}</TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center h-24">No tests found for this panchayat yet.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    )
}

    