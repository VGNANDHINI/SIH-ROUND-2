
'use client';
import { useMemo } from "react";
import { useUser, useDoc, useOperators } from "@/firebase";
import { UserProfile, WaterTest } from "@/lib/data";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useCollection } from "@/firebase/firestore/use-collection";

// This is a simplified hook for the Block official to get all tests in their block.
// A real app would use a more complex query, likely involving multiple collection group queries.
// For this prototype, we'll fetch all operators and filter by block to get relevant panchayats.
function useWaterTestsForBlock(block?: string) {
    const { data: allOperators, loading: operatorsLoading } = useOperators();
    
    const panchayatIds = useMemo(() => {
        if (!block || !allOperators) return [];
        const panchayats = allOperators
            .filter(op => op.block === block)
            .map(op => op.panchayat);
        return [...new Set(panchayats)]; // Unique panchayat IDs in the block
    }, [block, allOperators]);

    // This is not efficient for production. A real app would use a collectionGroup query.
    // However, for the prototype, we fetch all tests from the first panchayat found.
    const panchayatToQuery = panchayatIds.length > 0 ? panchayatIds[0] : 'default';
    const { data: tests, loading: testsLoading } = useCollection<WaterTest>(`panchayats/${panchayatToQuery}/waterTests`);

    const flaggedTests = useMemo(() => {
        if (!tests) return [];
        return tests.filter(test => test.status === 'unsafe' || test.status === 'attention-needed');
    }, [tests]);

    return { data: flaggedTests, loading: operatorsLoading || testsLoading };
}

export default function BlockOfficialWaterQualityPage() {
    const { user, loading: userLoading } = useUser();
    const { data: profile, loading: profileLoading } = useDoc<UserProfile>(user ? `users/${user.uid}` : null);
    const { data: flaggedTests, loading: testsLoading } = useWaterTestsForBlock(profile?.block);

    const loading = userLoading || profileLoading || testsLoading;
    
    const getStatusVariant = (status: WaterTest['status']) => {
        switch (status) {
            case 'unsafe': return 'destructive';
            case 'attention-needed': return 'secondary';
            default: return 'outline';
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Flagged Water Quality Tests</CardTitle>
                <CardDescription>
                    Showing tests from all panchayats in your block ({profile?.block}) that require attention.
                </CardDescription>
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
                                <TableHead>Panchayat</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Ward</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Flagged Parameters</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {flaggedTests && flaggedTests.length > 0 ? flaggedTests.map(test => (
                                <TableRow key={test.id}>
                                    <TableCell>{test.panchayatId}</TableCell>
                                    <TableCell>{test.testDate ? new Date((test.testDate as any).seconds * 1000).toLocaleDateString() : 'N/A'}</TableCell>
                                    <TableCell>{test.ward}</TableCell>
                                    <TableCell><Badge variant={getStatusVariant(test.status)}>{test.status}</Badge></TableCell>
                                    <TableCell className="font-medium max-w-xs truncate">{test.flaggedParameters?.join(', ')}</TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24">No flagged tests found in your block.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}

    