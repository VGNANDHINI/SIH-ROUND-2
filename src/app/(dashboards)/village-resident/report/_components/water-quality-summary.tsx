
'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { WaterTest } from '@/lib/data';
import { useMemo } from 'react';

const PARAMETERS = ['pH', 'Turbidity', 'Chlorine', 'TDS', 'Iron', 'Fluoride', 'Nitrate'];

export function WaterQualitySummary({ waterTests }: { waterTests: WaterTest[] | null }) {
    const latestTest = useMemo(() => {
        if (!waterTests || waterTests.length === 0) return null;
        // Assuming tests are sorted by date descending from the hook
        return waterTests[0];
    }, [waterTests]);

    const getStatusVariant = (isSafe: boolean) => (isSafe ? 'success' : 'destructive');

    // These are simplified checks for the UI. The actual flagging happens in the form.
    const parameterChecks = {
        pH: (val: number) => val >= 6.5 && val <= 8.5,
        Turbidity: (val: number) => val <= 1,
        Chlorine: (val: number) => val >= 0.2,
        TDS: (val: number) => val <= 500,
        Iron: (val: number) => val <= 0.3,
        Fluoride: (val: number) => val >= 0.6 && val <= 1.2,
        Nitrate: (val: number) => val <= 45,
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Water Quality Snapshot</CardTitle>
                <CardDescription>
                    Based on the latest test on {latestTest?.testDate ? new Date((latestTest.testDate as any).seconds * 1000).toLocaleDateString() : 'N/A'}.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {latestTest ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Parameter</TableHead>
                                <TableHead>Reading</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {PARAMETERS.map(param => {
                                const key = param.toLowerCase() as keyof WaterTest;
                                const value = latestTest[key] as number;
                                const checkFn = (parameterChecks as any)[param];
                                const isSafe = checkFn ? checkFn(value) : true;

                                return (
                                    <TableRow key={param}>
                                        <TableCell>{param}</TableCell>
                                        <TableCell>{value}</TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusVariant(isSafe)}>
                                                {isSafe ? 'Safe' : 'Out of Range'}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                ) : (
                    <p className="text-center text-muted-foreground py-10">No water quality data available.</p>
                )}
            </CardContent>
        </Card>
    );
}
