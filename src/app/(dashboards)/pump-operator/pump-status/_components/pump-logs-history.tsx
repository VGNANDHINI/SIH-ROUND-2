'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2 } from 'lucide-react';
import type { PumpLog } from '@/lib/data';
import { useMemo } from 'react';

function formatDuration(seconds: number) {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
}

export function PumpLogsHistory({ logs, loading }: { logs: PumpLog[] | null; loading: boolean }) {
    
    const completedLogs = useMemo(() => {
        if (!logs) return [];
        return logs
            .filter(log => log.endTime)
            .sort((a, b) => b.endTime.seconds - a.endTime.seconds)
            .slice(0, 10);
    }, [logs]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Recent Pump Logs</CardTitle>
                <CardDescription>Showing the last 10 completed pump sessions.</CardDescription>
            </CardHeader>
            <CardContent>
                {loading && !logs ? (
                    <div className="flex justify-center items-center h-48">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>On Time</TableHead>
                                <TableHead>Off Time</TableHead>
                                <TableHead>Duration</TableHead>
                                <TableHead>Water (L)</TableHead>
                                <TableHead>Energy (kWh)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {completedLogs.length > 0 ? completedLogs.map(log => (
                                <TableRow key={log.id}>
                                    <TableCell>{new Date(log.startTime.seconds * 1000).toLocaleDateString()}</TableCell>
                                    <TableCell>{new Date(log.startTime.seconds * 1000).toLocaleTimeString()}</TableCell>
                                    <TableCell>{new Date(log.endTime.seconds * 1000).toLocaleTimeString()}</TableCell>
                                    <TableCell>{formatDuration(log.duration || 0)}</TableCell>
                                    <TableCell>{log.waterSupplied?.toLocaleString()}</TableCell>
                                    <TableCell>{log.energyConsumed}</TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-24">
                                        No completed logs yet.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}
